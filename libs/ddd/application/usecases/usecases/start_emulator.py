import json
import threading
import time
from abc import ABC, abstractmethod
from typing import Any

from confluent_kafka.admin import AdminClient, NewTopic
from dtos.emulation_dto import EmulationScheduledDTO, StartEmulatorDTO
from fake_factory.fraud.device_factory import DeviceLogFactory
from fake_factory.fraud.transaction_factory import TransactionFakeFactory
from fake_factory.fraud.user_profile_factory import UserProfileFactory
from fastapi import BackgroundTasks
from logger.log import get_logger_from_env
from mem_repository.in_memory_repository import InMemoryRepository
from producers.kafka.producer import KafkaProducerStrategy
from storage.minio.storage import MinioStorageClient
from value_objects.emulator_id import EmulationID

logger = get_logger_from_env(__name__)


def convert_to_csv(dict_list) -> str:
    """
    Converts a list of dictionaries to a CSV string.
    Each dictionary represents a row, and the keys are the column headers.
    Args:
        dict_list (list): List of dictionaries to convert.
    Returns:
        str: CSV formatted string.
    """
    if not dict_list:
        return ""
    headers = list(dict_list[0].keys())
    lines = [",".join(headers)]
    for data in dict_list:
        row = ",".join(str(data.get(key, "")) for key in headers)
        lines.append(row)
    return "\n".join(lines)


class SyncProducer(ABC):
    """Abstract base class for synchronous producers."""

    @abstractmethod
    def produce(self, topic: str, key: str, value: dict[str, Any]) -> None:
        """Produces a message to the given topic."""
        pass

    @abstractmethod
    def flush(self) -> None:
        """Flushes the producer, ensuring all messages are sent."""
        pass

    @abstractmethod
    def setup_resource(self, topic: str) -> None:
        """Sets up the producer resource (e.g., create a topic or bucket)."""
        pass


class KafkaFactorySyncProducerWrapper(SyncProducer):
    """Synchronous Kafka producer wrapper implementation."""

    def __init__(
        self,
        kafka_producer: KafkaProducerStrategy,
        kafka_brokers: str,
        num_partitions: int = 5,
        replication_factor: int = 2,
    ):
        self.kafka_producer = kafka_producer
        self.kafka_brokers = kafka_brokers
        self.num_partitions = num_partitions
        self.replication_factor = replication_factor

    def setup_resource(self, topic: str) -> None:
        """Creates the Kafka topic if it does not already exist."""
        admin_client = AdminClient({"bootstrap.servers": self.kafka_brokers})
        metadata = admin_client.list_topics(timeout=10)
        if topic not in metadata.topics:
            new_topic = NewTopic(
                topic=topic,
                num_partitions=self.num_partitions,
                replication_factor=self.replication_factor,
            )
            fs = admin_client.create_topics([new_topic])
            for t, future in fs.items():
                try:
                    future.result()
                    logger.info(f"Topic {t} created successfully")
                except Exception as e:
                    logger.error(f"Failed to create topic {t}: {e}")
        else:
            logger.info(f"Topic {topic} already exists")

    def produce(self, topic: str, key: str, value: dict[str, Any]) -> None:
        """
        Produces a message to a Kafka topic.

        Args:
            topic (str): The Kafka topic to send the message to.
            key (str): The key of the message.
            value (dict[str, Any]): The message payload.
        """
        try:
            self.kafka_producer.produce(topic=topic, key=key, value=json.dumps(value))
        except Exception as e:
            logger.error(f"Kafka production error: {e}")

    def flush(self) -> None:
        """Flushes the Kafka producer."""
        self.kafka_producer.flush()


class MinioFactorySyncProducerWrapper(SyncProducer):
    """Synchronous Minio producer wrapper implementation.

    This implementation uses a MinioClient to upload messages as individual objects.
    """

    def __init__(
        self,
        minio_client: MinioStorageClient,
        sync_type: str,
        format_type: str,
        max_chunk_size: int = None,
    ):
        self.minio_client = minio_client
        self.bucket = None
        self.sync_type = sync_type.lower()
        self.format_type = format_type.lower()
        self.max_chunk_size = max_chunk_size
        self.lock = threading.Lock()
        if self.sync_type in ("grouped", "chunked"):
            self.buffer = []
            self.current_chunk_size = 0

    def setup_resource(self, bucket_name: str) -> None:
        """
        Creates a bucket on Minio if it does not already exist.

        Args:
            bucket_name (str): The name of the bucket (used as the "topic").
        """
        self.bucket = bucket_name
        buckets = self.minio_client.list_buckets()
        if bucket_name not in buckets:
            self.minio_client.create_bucket(bucket_name)
            logger.info(f"Bucket {bucket_name} created successfully")
        else:
            logger.info(f"Bucket {bucket_name} already exists")

    def produce(self, topic: str, key: str, value: dict[str, Any]) -> None:
        """
        Produces a message to the Minio bucket.
        Args:
            topic (str): The Minio bucket name (used as the "topic").
            key (str): The key of the message.
            value (dict[str, Any]): The message payload.
        """
        if self.sync_type in ("grouped", "chunked"):
            serialized_value = json.dumps(value)
            message_bytes = serialized_value.encode("utf-8")
            message_size = len(message_bytes)

            with self.lock:
                self.buffer.append(value)
                if self.sync_type == "chunked":
                    self.current_chunk_size += message_size
                    if (
                        self.max_chunk_size is not None
                        and self.current_chunk_size >= self.max_chunk_size
                    ):
                        self._flush_current_chunk()
        else:
            message_bytes = json.dumps(value).encode("utf-8")
            object_name = f"{key}_{int(time.time() * 1000)}.{self.format_type}"
            with self.lock:
                self.minio_client.upload_bytes(self.bucket, object_name, message_bytes)
            logger.info(f"Uploaded object {object_name} to bucket {self.bucket}")

    def _flush_current_chunk(self) -> None:
        """Flushes the current chunk of messages to Minio."""
        if not self.buffer:
            return

        if self.format_type == "json":
            aggregate_data = json.dumps(self.buffer)
        elif self.format_type == "csv":
            aggregate_data = convert_to_csv(self.buffer)
        else:
            aggregate_data = json.dumps(self.buffer)

        object_name = f"aggregated_{int(time.time() * 1000)}.{self.format_type}"
        self.minio_client.upload_bytes(
            self.bucket, object_name, aggregate_data.encode("utf-8")
        )
        logger.info(
            f"Chunk flushed: {object_name} with size {self.current_chunk_size} bytes"
        )
        self.buffer.clear()
        self.current_chunk_size = 0

    def flush(self) -> None:
        """Flushes the producer, ensuring all messages are sent."""
        if self.sync_type in ("grouped", "chunked"):
            with self.lock:
                self._flush_current_chunk()


class ProducerWrapperFactory:
    """Factory class for creating producer wrappers based on the sync type."""

    def __init__(
        self,
        kafka_producer: KafkaProducerStrategy,
        kafka_brokers: str,
        minio_client: MinioStorageClient,
    ):
        self.kafka_producer = kafka_producer
        self.kafka_brokers = kafka_brokers
        self.minio_client = minio_client

    def create_producer_wrapper(self, dto: StartEmulatorDTO) -> SyncProducer:
        """
        Creates a producer wrapper based on the sync type specified in the DTO.
        Args:
            dto (StartEmulatorDTO): The DTO containing emulator parameters.
        Returns:
            SyncProducer: An instance of the appropriate producer wrapper.
        Raises:
            ValueError: If the sync type is not supported.
        """
        if dto.emulator_sync == "minio":
            return MinioFactorySyncProducerWrapper(
                minio_client=self.minio_client,
                sync_type=dto.sync_type,
                format_type=dto.format_type,
                max_chunk_size=dto.max_chunk_size,
            )
        elif dto.emulator_sync == "kafka":
            return KafkaFactorySyncProducerWrapper(
                self.kafka_producer,
                self.kafka_brokers,
            )
        else:
            raise ValueError(f"Unsupported emulator sync type: {dto.emulator_sync}")


class StartEmulatorUseCase:
    """Use case for starting the data emulator with flexible sync strategies."""

    def __init__(
        self,
        kafka_producer: KafkaProducerStrategy,
        kafka_brokers: str,
        minio_client: MinioStorageClient,
        repository: InMemoryRepository,
    ):
        self.repository = repository
        self.topics_mapping = {
            "transaction": "transactions",
            "user-profile": "user-profiles",
            "device-log": "device-logs",
            "default": "default_topic",
        }
        self.fake_factories: dict[str, Any] = {
            "transaction": TransactionFakeFactory,
            "user-profile": UserProfileFactory,
            "device-log": DeviceLogFactory,
        }
        self.producer_wrapper_factory = ProducerWrapperFactory(
            kafka_producer=kafka_producer,
            kafka_brokers=kafka_brokers,
            minio_client=minio_client,
        )

    def execute(
        self, dto: StartEmulatorDTO, background_tasks: BackgroundTasks, num_threads: int
    ) -> EmulationScheduledDTO:
        """
        Executes the emulator and schedules the background emulation task.

        Args:
            dto (StartEmulatorDTO): The DTO containing emulator parameters.
            background_tasks (BackgroundTasks): FastAPI background tasks manager.
            num_threads (int): Number of parallel threads to run.

        Returns:
            EmulationScheduledDTO: DTO with details about the scheduled emulation.

        Raises:
            ValueError: If the sync type or domain is not supported.
        """
        emulation_id = EmulationID.generate()
        self.repository.create_status(emulation_id.value, "processing")

        # Determine the target topic (or bucket name) based on the emulation domain.
        domain = dto.emulation_domain.lower()
        topic = self.topics_mapping.get(domain, self.topics_mapping["default"])
        producer_wrapper = self.producer_wrapper_factory.create_producer_wrapper(dto)
        producer_wrapper.setup_resource(topic)

        # Retrieve the appropriate fake factory for the specified domain.
        fake_factory_class = self.fake_factories.get(domain)
        if fake_factory_class is None:
            raise ValueError(f"Domain not supported: {dto.emulation_domain}")
        fake_factory = fake_factory_class()

        # Schedule the background emulation task.
        background_tasks.add_task(
            self._run_emulation_task,
            emulation_id,
            producer_wrapper,
            topic,
            fake_factory,
            dto.timeout,
            num_threads,
        )

        return EmulationScheduledDTO(
            id=emulation_id,
            emulator_sync=dto.emulator_sync,
            emulation_domain=dto.emulation_domain,
            format_type=dto.format_type,
            sync_type=dto.sync_type,
            max_chunk_size=dto.max_chunk_size,
            timeout=dto.timeout,
        )

    def produce_data(
        self,
        emulation_id: Any,
        thread_id: int,
        producer: SyncProducer,
        topic: str,
        stop_event: threading.Event,
        factory: Any,
    ) -> None:
        """
        Produces data continuously until the stop event is triggered.

        Args:
            emulation_id (Any): Unique emulation identifier.
            thread_id (int): Identifier for the thread.
            producer (SyncProducer): The producer instance.
            topic (str): Target topic or output resource.
            stop_event (threading.Event): Event to signal when to stop production.
            factory(Any): The fake data factory.
        """
        self.repository.update_thread_status(emulation_id.value, thread_id, "started")
        while not stop_event.is_set():
            fake_data = factory.generate()
            if fake_data is None:
                logger.info(f"Thread {thread_id} - No more data to process")
                break
            message_payload = {
                "emulation_id": str(emulation_id.value),
                "timestamp": time.time(),
                "data": fake_data,
            }
            try:
                key = fake_data.get("transaction_id", str(time.time()))
                producer.produce(topic=topic, key=key, value=message_payload)
                logger.info(f"Thread {thread_id} - Produced message: {message_payload}")
            except Exception as e:
                logger.error(f"Failed to produce message: {e}")
                self.repository.update_thread_status(
                    emulation_id.value, thread_id, "error"
                )
        self.repository.update_thread_status(emulation_id.value, thread_id, "finished")

    def produce_data_in_parallel(
        self,
        emulation_id: Any,
        producer: SyncProducer,
        topic: str,
        factory: Any,
        stop_event: threading.Event,
        num_threads: int,
    ) -> None:
        """
        Starts multiple threads to produce data in parallel.

        Args:
            emulation_id (Any): Unique emulation identifier.
            producer (SyncProducer): The producer instance.
            topic (str): Target topic or output resource.
            factory (Any): The fake data factory.
            stop_event (threading.Event): Event to signal when to stop production.
            num_threads (int): Number of parallel threads to run.
        """
        threads = []
        try:
            for i in range(num_threads):
                thread = threading.Thread(
                    target=self.produce_data,
                    args=(emulation_id, i, producer, topic, stop_event, factory),
                )
                thread.daemon = True
                thread.start()
                threads.append(thread)
            for thread in threads:
                thread.join()
        except Exception as e:
            logger.error(f"Failed to start threads: {e}")

    def _run_emulation_task(
        self,
        emulation_id: Any,
        producer: SyncProducer,
        topic: str,
        factory: Any,
        timeout: float,
        num_threads: int,
    ) -> None:
        """
        Runs the emulation task until the specified timeout elapses.

        Args:
            emulation_id (Any): Unique emulation identifier.
            producer (SyncProducer): The producer instance.
            topic (str): Target topic or output resource.
            factory (Any): The fake data factory.
            timeout (float): Emulation duration in seconds.
            num_threads (int): Number of parallel threads to run.
        """
        stop_event = threading.Event()
        timer = threading.Timer(timeout, stop_event.set)
        timer.start()

        self.produce_data_in_parallel(
            emulation_id, producer, topic, factory, stop_event, num_threads
        )
        timer.cancel()
        producer.flush()
        logger.info("Emulation finished")
        self.repository.update_status(emulation_id.value, "completed")
