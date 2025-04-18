import threading
import time
import unittest
from unittest.mock import MagicMock, patch

from dtos.emulation_dto import EmulationScheduledDTO, StartEmulatorDTO
from logger.log import get_logger_from_env
from mem_repository.in_memory_repository import InMemoryRepository
from producers.kafka.producer import KafkaProducerStrategy
from storage.minio.storage import MinioStorageClient
from usecases.start_emulator import StartEmulatorUseCase, SyncProducer

logger = get_logger_from_env(__name__)


class DummyEmulationID:
    def __init__(self, value):
        self.value = value


class DummyBackgroundTasks:
    def __init__(self):
        self.tasks = []

    def add_task(self, func, *args, **kwargs):
        self.tasks.append((func, args, kwargs))


class DummyFakeFactory:
    def generate(self):
        return {"transaction_id": "dummy_txn", "value": 123}


class DummySyncProducer(SyncProducer):
    def __init__(self):
        self.produce_called = 0
        self.flush_called = False

    def produce(self, topic: str, key: str, value: dict):
        self.produce_called += 1

    def flush(self):
        self.flush_called = True

    def setup_resource(self, resource_name: str) -> None:
        pass


class TestStartEmulatorUseCase(unittest.TestCase):
    def setUp(self):
        self.dummy_kafka_producer = MagicMock(spec=KafkaProducerStrategy)
        self.dummy_minio_client = MagicMock(spec=MinioStorageClient)
        self.kafka_brokers = "dummy_broker:9092"
        self.dummy_repository = MagicMock(spec=InMemoryRepository)

        self.use_case = StartEmulatorUseCase(
            kafka_producer=self.dummy_kafka_producer,
            kafka_brokers=self.kafka_brokers,
            minio_client=self.dummy_minio_client,
            repository=self.dummy_repository,
        )

        self.use_case.fake_factories = {
            "transaction": DummyFakeFactory,
            "user-profile": DummyFakeFactory,
            "device-log": DummyFakeFactory,
        }
        self.use_case.topics_mapping = {
            "transaction": "transactions_topic",
            "user-profile": "user_profiles_topic",
            "device-log": "device_logs_topic",
            "default": "default_topic",
        }

        self.dummy_producer_wrapper = MagicMock(spec=SyncProducer)

        class DummyProducerWrapperFactory:
            def create_producer_wrapper(inner_self, dto):
                if dto.emulator_sync in ("kafka", "minio"):
                    return self.dummy_producer_wrapper
                else:
                    raise ValueError(
                        f"Unsupported emulator sync type: {dto.emulator_sync}"
                    )

        self.use_case.producer_wrapper_factory = DummyProducerWrapperFactory()

    def test_execute_valid(self):
        dto = StartEmulatorDTO(
            emulator_sync="kafka",
            emulation_domain="transaction",
            timeout=2,
            format_type="json",
            sync_type="grouped",
            max_chunk_size=1024,
        )
        background_tasks = DummyBackgroundTasks()
        num_threads = 2

        result = self.use_case.execute(dto, background_tasks, num_threads)
        self.assertIsInstance(result, EmulationScheduledDTO)
        self.assertEqual(result.emulator_sync, dto.emulator_sync)
        self.assertEqual(result.emulation_domain, dto.emulation_domain)
        self.assertEqual(result.timeout, dto.timeout)
        self.assertGreater(len(background_tasks.tasks), 0)
        self.dummy_producer_wrapper.setup_resource.assert_called_with(
            "transactions_topic"
        )

    def test_execute_invalid_sync(self):
        dto = StartEmulatorDTO(
            emulator_sync="unsupported",
            emulation_domain="transaction",
            timeout=2,
            format_type="json",
            sync_type="grouped",
            max_chunk_size=1024,
        )
        background_tasks = DummyBackgroundTasks()
        with self.assertRaises(ValueError) as cm:
            self.use_case.execute(dto, background_tasks, num_threads=1)
        self.assertIn("Unsupported emulator sync type", str(cm.exception))

    def test_execute_invalid_domain(self):
        dto = StartEmulatorDTO(
            emulator_sync="kafka",
            emulation_domain="unsupported_domain",
            timeout=2,
            format_type="json",
            sync_type="grouped",
            max_chunk_size=1024,
        )
        background_tasks = DummyBackgroundTasks()
        with self.assertRaises(ValueError) as cm:
            self.use_case.execute(dto, background_tasks, num_threads=1)
        self.assertIn("Domain not supported", str(cm.exception))

    def test_produce_data(self):
        dummy_producer = DummySyncProducer()
        fake_factory = MagicMock()
        fake_factory.generate.side_effect = [
            {"transaction_id": "txn1", "value": 100},
            None,
        ]
        stop_event = threading.Event()
        dummy_emul_id = DummyEmulationID("emul_id")
        self.use_case.produce_data(
            dummy_emul_id, 0, dummy_producer, "dummy_topic", stop_event, fake_factory
        )
        self.assertEqual(dummy_producer.produce_called, 1)

    def test_produce_data_exception(self):
        dummy_producer = DummySyncProducer()
        fake_factory = MagicMock()
        fake_factory.generate.side_effect = [
            {"transaction_id": "txn_error", "value": 50},
            None,
        ]

        def raise_exception(*args, **kwargs):
            raise Exception("Test production failure")

        dummy_producer.produce = raise_exception
        stop_event = threading.Event()
        dummy_emul_id = DummyEmulationID("emul_id")
        thread = threading.Thread(
            target=self.use_case.produce_data,
            args=(
                dummy_emul_id,
                0,
                dummy_producer,
                "dummy_topic",
                stop_event,
                fake_factory,
            ),
        )
        thread.daemon = True
        thread.start()
        time.sleep(0.5)
        stop_event.set()
        thread.join(timeout=1)
        self.assertEqual(dummy_producer.produce_called, 0)

    @patch.object(StartEmulatorUseCase, "produce_data", autospec=True)
    def test_produce_data_in_parallel(self, mock_produce_data):
        dummy_producer = DummySyncProducer()
        fake_factory = DummyFakeFactory()
        stop_event = threading.Event()
        dummy_emul_id = DummyEmulationID("emul_id")
        num_threads = 3

        self.use_case.produce_data_in_parallel(
            dummy_emul_id,
            dummy_producer,
            "dummy_topic",
            fake_factory,
            stop_event,
            num_threads,
        )
        self.assertEqual(mock_produce_data.call_count, num_threads)

    def test_run_emulation_task(self):
        dummy_producer = DummySyncProducer()

        def fake_generate():
            time.sleep(0.4)
            return {"transaction_id": "txn", "value": 100}

        fake_factory = DummyFakeFactory()
        fake_factory.generate = fake_generate

        dummy_emul_id = DummyEmulationID("emul_id")
        start_time = time.time()
        self.use_case._run_emulation_task(
            dummy_emul_id,
            dummy_producer,
            "dummy_topic",
            fake_factory,
            timeout=1,
            num_threads=2,
        )
        elapsed = time.time() - start_time
        self.assertTrue(dummy_producer.flush_called)
        self.assertGreaterEqual(elapsed, 0.8)

    def test_run_emulation_task_with_multiple_records(self):
        dummy_producer = DummySyncProducer()
        count = 0

        def fake_generate():
            nonlocal count
            if count < 3:
                time.sleep(0.4)
                count += 1
                return {"transaction_id": f"txn_{count}", "value": 100}
            else:
                return None

        fake_factory = DummyFakeFactory()
        fake_factory.generate = fake_generate
        dummy_emul_id = DummyEmulationID("emul_id")
        start_time = time.time()
        self.use_case._run_emulation_task(
            dummy_emul_id,
            dummy_producer,
            "dummy_topic",
            fake_factory,
            timeout=2,
            num_threads=1,
        )
        elapsed = time.time() - start_time
        self.assertTrue(dummy_producer.flush_called)
        self.assertGreaterEqual(dummy_producer.produce_called, 3)
        self.assertGreaterEqual(elapsed, 1.2)

    def test_run_emulation_task_zero_timeout(self):
        dummy_producer = DummySyncProducer()

        def fake_generate():
            time.sleep(0.1)
            return {"transaction_id": "txn_zero", "value": 200}

        fake_factory = DummyFakeFactory()
        fake_factory.generate = fake_generate
        dummy_emul_id = DummyEmulationID("emul_id")
        start_time = time.time()
        self.use_case._run_emulation_task(
            dummy_emul_id,
            dummy_producer,
            "dummy_topic",
            fake_factory,
            timeout=0,
            num_threads=1,
        )
        elapsed = time.time() - start_time
        self.assertTrue(dummy_producer.flush_called)
        self.assertLess(elapsed, 0.5)


if __name__ == "__main__":
    unittest.main()
