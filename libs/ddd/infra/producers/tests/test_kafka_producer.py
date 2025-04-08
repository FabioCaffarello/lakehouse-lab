import json
import unittest
from unittest.mock import MagicMock

from producers.kafka.producer import KafkaProducerStrategy


class DummyMessage:
    def __init__(self, key, topic, partition):
        self._key = key
        self._topic = topic
        self._partition = partition

    def key(self):
        return self._key

    def topic(self):
        return self._topic

    def partition(self):
        return self._partition


class TestKafkaProducerStrategy(unittest.TestCase):
    def setUp(self):
        self.bootstrap_servers = "localhost:9092"
        self.strategy = KafkaProducerStrategy(bootstrap_servers=self.bootstrap_servers)
        self.strategy.producer = MagicMock()

    def test_get_producer(self):
        producer = self.strategy.get_producer()
        self.assertEqual(producer, self.strategy.producer)

    def test_flush(self):
        self.strategy.flush(30)
        self.strategy.producer.flush.assert_called_with(30)

    def test_produce_success(self):
        topic = "test_topic"
        key = "test_key"
        value = {"data": "value"}
        self.strategy.producer.produce.return_value = None
        self.strategy.producer.poll.return_value = None

        self.strategy.produce(topic, key, value)

        self.strategy.producer.produce.assert_called_once()
        args, kwargs = self.strategy.producer.produce.call_args
        self.assertEqual(args[0], topic)
        self.assertEqual(kwargs["key"], key)
        expected_encoded = json.dumps(value).encode("utf-8")
        self.assertEqual(kwargs["value"], expected_encoded)
        self.assertIn("callback", kwargs)
        self.strategy.producer.poll.assert_called_with(0)

    def test_produce_failure(self):
        topic = "test_topic"
        key = "test_key"
        value = {"data": "value"}
        self.strategy.producer.produce.side_effect = Exception("Produce error")
        with self.assertRaises(Exception) as context:
            self.strategy.produce(topic, key, value)
        self.assertIn("Produce error", str(context.exception))

    def test_delivery_report_success(self):
        dummy_msg = DummyMessage(key="test_key", topic="test_topic", partition=1)
        try:
            self.strategy.delivery_report(None, dummy_msg)
        except Exception as e:
            self.fail(f"delivery_report raised an exception on success: {e}")

    def test_delivery_report_failure(self):
        error = Exception("Delivery failed")
        dummy_msg = DummyMessage(key="test_key", topic="test_topic", partition=1)
        try:
            self.strategy.delivery_report(error, dummy_msg)
        except Exception as e:
            self.fail(f"delivery_report raised an exception on error: {e}")


if __name__ == "__main__":
    unittest.main()
