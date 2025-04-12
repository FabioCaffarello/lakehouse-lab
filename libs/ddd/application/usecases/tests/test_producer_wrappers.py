import json
import unittest
from unittest.mock import patch

from dtos.emulation_dto import StartEmulatorDTO
from producers.kafka.producer import KafkaProducerStrategy
from storage.minio.storage import MinioStorageClient
from usecases.start_emulator import (
    KafkaFactorySyncProducerWrapper,
    MinioFactorySyncProducerWrapper,
    ProducerWrapperFactory,
)


class DummyMetadata:
    def __init__(self):
        self.topics = {}


class DummyFuture:
    def result(self):
        return None


class DummyAdminClient:
    created_topics = []

    def __init__(self, conf):
        self.conf = conf
        self.metadata = DummyMetadata()
        self.called_create_topics = 0

    def list_topics(self, timeout):
        return self.metadata

    def create_topics(self, topics):
        self.called_create_topics += 1
        DummyAdminClient.created_topics.extend([t.topic for t in topics])
        return {t.topic: DummyFuture() for t in topics}


class DummyKafkaProducer(KafkaProducerStrategy):
    def __init__(self):
        self.produced_messages = []
        self.flushed = False

    def produce(self, topic, key, value):
        self.produced_messages.append((topic, key, value))

    def flush(self):
        self.flushed = True


class TestKafkaFactorySyncProducerWrapper(unittest.TestCase):
    def test_setup_resource_topic_not_exist(self):
        DummyAdminClient.created_topics = []

        with patch("usecases.start_emulator.AdminClient", new=DummyAdminClient):
            dummy_kafka_producer = DummyKafkaProducer()
            wrapper = KafkaFactorySyncProducerWrapper(
                dummy_kafka_producer, "dummy_broker"
            )
            wrapper.setup_resource("test_topic")
            self.assertIn("test_topic", DummyAdminClient.created_topics)

            def new_metadata():
                m = DummyMetadata()
                m.topics = {"existing_topic": None}
                return m

            original_init = DummyAdminClient.__init__

            def new_init(self, conf):
                original_init(self, conf)
                self.metadata = new_metadata()

            with patch.object(DummyAdminClient, "__init__", new=new_init):
                wrapper.setup_resource("existing_topic")
                self.assertNotIn("existing_topic", DummyAdminClient.created_topics)

    def test_produce_and_flush(self):
        with patch("usecases.start_emulator.AdminClient", new=DummyAdminClient):
            dummy_kafka_producer = DummyKafkaProducer()
            wrapper = KafkaFactorySyncProducerWrapper(
                dummy_kafka_producer, "dummy_broker"
            )
            test_value = {"foo": "bar"}
            wrapper.produce("some_topic", "key1", test_value)
            self.assertEqual(len(dummy_kafka_producer.produced_messages), 1)
            topic, key, value_str = dummy_kafka_producer.produced_messages[0]
            self.assertEqual(topic, "some_topic")
            self.assertEqual(key, "key1")
            self.assertEqual(json.loads(value_str), test_value)
            wrapper.flush()
            self.assertTrue(dummy_kafka_producer.flushed)


class DummyMinioClient(MinioStorageClient):
    def __init__(self):
        self.buckets = []
        self.uploaded = []

    def list_buckets(self):
        return self.buckets

    def create_bucket(self, bucket_name):
        self.buckets.append(bucket_name)

    def upload_bytes(self, bucket, object_name, data):
        self.uploaded.append((bucket, object_name, data))


class TestMinioFactorySyncProducerWrapper(unittest.TestCase):
    def setUp(self):
        self.dummy_minio = DummyMinioClient()
        self.bucket_name = "test_bucket"

    def test_setup_resource_bucket_not_exist(self):
        wrapper = MinioFactorySyncProducerWrapper(
            minio_client=self.dummy_minio, sync_type="grouped", format_type="json"
        )
        wrapper.setup_resource(self.bucket_name)
        self.assertIn(self.bucket_name, self.dummy_minio.buckets)

    def test_setup_resource_bucket_exists(self):
        self.dummy_minio.buckets.append(self.bucket_name)
        wrapper = MinioFactorySyncProducerWrapper(
            minio_client=self.dummy_minio, sync_type="grouped", format_type="json"
        )
        wrapper.setup_resource(self.bucket_name)
        self.assertEqual(self.dummy_minio.buckets.count(self.bucket_name), 1)

    def test_produce_grouped_mode(self):
        wrapper = MinioFactorySyncProducerWrapper(
            minio_client=self.dummy_minio, sync_type="grouped", format_type="json"
        )
        wrapper.setup_resource(self.bucket_name)
        wrapper.produce(self.bucket_name, "key1", {"data": "value"})
        self.assertEqual(len(wrapper.buffer), 1)
        wrapper.flush()
        self.assertEqual(len(wrapper.buffer), 0)
        self.assertGreater(len(self.dummy_minio.uploaded), 0)

    def test_produce_chunked_mode_triggers_flush(self):
        wrapper = MinioFactorySyncProducerWrapper(
            minio_client=self.dummy_minio,
            sync_type="chunked",
            format_type="csv",
            max_chunk_size=10,
        )
        wrapper.setup_resource(self.bucket_name)
        wrapper.produce(
            self.bucket_name, "key2", {"data": "long_value_exceeding_limit"}
        )
        self.assertEqual(len(wrapper.buffer), 0)
        self.assertGreater(len(self.dummy_minio.uploaded), 0)

    def test_produce_else_mode(self):
        wrapper = MinioFactorySyncProducerWrapper(
            minio_client=self.dummy_minio, sync_type="other", format_type="json"
        )
        wrapper.setup_resource(self.bucket_name)
        import usecases.start_emulator as start_emulator_module

        setattr(start_emulator_module, "file_extens", "txt")
        try:
            wrapper.produce(self.bucket_name, "key3", {"data": "test"})
        finally:
            delattr(start_emulator_module, "file_extens")
        uploaded_objs = self.dummy_minio.uploaded
        self.assertTrue(
            any("key3" in obj[1] and obj[1].endswith(".txt") for obj in uploaded_objs)
        )


class TestProducerWrapperFactory(unittest.TestCase):
    def setUp(self):
        self.dummy_kafka_producer = DummyKafkaProducer()
        self.dummy_minio = DummyMinioClient()
        self.kafka_brokers = "dummy_broker:9092"
        self.factory = ProducerWrapperFactory(
            kafka_producer=self.dummy_kafka_producer,
            kafka_brokers=self.kafka_brokers,
            minio_client=self.dummy_minio,
        )

    def test_create_producer_wrapper_minio(self):
        dto = StartEmulatorDTO(
            emulator_sync="minio",
            emulation_domain="transaction",
            timeout=1,
            format_type="json",
            sync_type="grouped",
            max_chunk_size=100,
        )
        wrapper = self.factory.create_producer_wrapper(dto)
        self.assertIsInstance(wrapper, MinioFactorySyncProducerWrapper)

    def test_create_producer_wrapper_kafka(self):
        dto = StartEmulatorDTO(
            emulator_sync="kafka",
            emulation_domain="transaction",
            timeout=1,
            format_type="json",
            sync_type="grouped",
            max_chunk_size=100,
        )
        wrapper = self.factory.create_producer_wrapper(dto)
        self.assertIsInstance(wrapper, KafkaFactorySyncProducerWrapper)

    def test_create_producer_wrapper_invalid(self):
        dto = StartEmulatorDTO(
            emulator_sync="invalid",
            emulation_domain="transaction",
            timeout=1,
            format_type="json",
            sync_type="grouped",
            max_chunk_size=100,
        )
        with self.assertRaises(ValueError) as context:
            self.factory.create_producer_wrapper(dto)
        self.assertIn("Unsupported emulator sync type", str(context.exception))


if __name__ == "__main__":
    unittest.main()
