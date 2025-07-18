import logging
import time
import unittest
import uuid

import rmq_queue.queue as queue

logging.basicConfig(level=logging.DEBUG)
logging.getLogger("pika").setLevel(logging.WARNING)


def generate_message():
    return bytes("whatever:message:" + str(uuid.uuid4()), encoding="utf-8")


def queue_pop(queue):
    msg = queue.pop()
    while msg is None:
        time.sleep(0.3)
        msg = queue.pop()
    return msg


class TestIntegrationConnection(unittest.TestCase):
    def setUp(self):
        self.queuename = "tests.rmbqueue.queue." + str(uuid.uuid4())
        self.connect()
        logging.disable(logging.CRITICAL)

    def tearDown(self):
        self.disconnect()

    def connect(self):
        self.connection = queue.connect()
        self.create_queue()

    def create_queue(self):
        self.queue = queue.Queue(self.connection, self.queuename, cache_enabled=False)

    def disconnect(self):
        self.connection.close()
        self.connection = None
        self.queue = None

    def should_push_pop(self):
        expected_message = generate_message()
        self.queue.push(expected_message)
        received_message = queue_pop(self.queue)
        self.assertEqual(expected_message, received_message)
        return received_message

    def test_should_push_pop(self):
        self.should_push_pop()

    def test_should_handle_reconnection(self):
        self.should_push_pop()
        self.connection.reconnect()
        self.should_push_pop()

    def test_heartbeat_is_safe(self):
        message_count = 10
        for i in range(message_count):
            expected_message = generate_message()
            self.connection.heartbeat()
            self.queue.push(expected_message)
            self.connection.heartbeat()
            received_message = queue_pop(self.queue)
            self.assertEqual(
                expected_message, received_message, f"failed on message {i}"
            )

    def test_messages_are_acknowledged_automatically(self):
        message = self.should_push_pop()
        self.disconnect()
        self.connect()
        self.queue.push(generate_message())
        new_message = queue_pop(self.queue)
        self.assertNotEqual(message, new_message)

    def test_queue_caches_len_calls(self):
        cache_max_age = 1.0
        q = queue.Queue(
            self.connection,
            self.queuename,
            cache_enabled=True,
            cache_max_age=cache_max_age,
        )
        self.assertEqual(q.len(), 0)
        q.push(generate_message())
        self.assertEqual(q.len(), 0)
        time.sleep(cache_max_age * 2)
        self.assertEqual(q.len(), 1)

    def tests_queue_knows_amount_of_messages(self):
        total_msgs = 10
        for i in range(total_msgs):
            msg_count = self.queue.len()
            self.assertEqual(msg_count, i)
            self.queue.push(generate_message())
            msg_count = self.queue.len()
            self.assertEqual(msg_count, i + 1)

        msgs_count = self.queue.len()
        self.assertEqual(msgs_count, total_msgs)

        for i in range(total_msgs):
            total_msgs -= 1
            queue_pop(self.queue)
            msg_count = self.queue.len()
            self.assertEqual(msg_count, total_msgs)

        msgs_count = self.queue.len()
        self.assertEqual(msgs_count, total_msgs)

    def test_cant_pop_message_when_disconnected(self):
        self.connection.close()
        self.check_operation_not_allowed_when_disconnected(self.queue.pop)

    def test_cant_push_message_when_disconnected(self):
        self.connection.close()
        self.check_operation_not_allowed_when_disconnected(
            lambda: self.queue.push(generate_message())
        )

    def test_handle_disconnected_ungracefully(self):
        operations = [
            lambda q: q.pop(),
            lambda q: q.push(generate_message()),
            lambda q: q.len(),
            lambda q: q.heartbeat(),
        ]
        for operation in operations:
            connection = queue.connect()
            q = queue.Queue(connection, self.queuename, cache_enabled=False)
            connection.close()
            self.check_operation_not_allowed_when_disconnected(lambda: operation(q))

    def test_size_must_be_bigger_than_zero(self):
        self.assertRaises(
            queue.InvalidSizeError,
            queue.Queue,
            self.connection,
            self.queuename,
            0,
        )
        self.assertRaises(
            queue.InvalidSizeError,
            queue.Queue,
            self.connection,
            self.queuename,
            -1,
        )

    def check_operation_not_allowed_when_disconnected(self, operation):
        self.assertRaises(Exception, operation)


if __name__ == "__main__":
    unittest.main()
