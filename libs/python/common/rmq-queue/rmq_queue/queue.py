import logging
import time

import pika
from pysd import service_discovery


class DisconnectedError(Exception):
    pass


class InvalidSizeError(Exception):
    pass


class Connection:
    def __init__(self, conn):
        self.__conn = conn
        self.__chan = None
        self.log = logging.getLogger("blackpearl.queue.connection")

    def declare_queue(self, name, passive, channel=None):
        """
        Use the connection to declare a queue
        """

        if channel is None:
            channel = self.__channel()

        return channel.queue_declare(
            queue=name,
            durable=True,
            auto_delete=False,
            exclusive=False,
            passive=passive,
        )

    def basic_get(self, queue_name):
        """
        Does a basic get on the given queue, with auto ack.
        Returns None if there is no message on the queue.
        """
        method, _, body = self.__channel().basic_get(
            queue=queue_name,
            auto_ack=True,
        )

        if not method:
            return None

        return body

    def basic_publish(self, queue_name, message):
        """
        Does a basic publish
        """
        persistent_delivery_mode = 2
        properties = pika.spec.BasicProperties(delivery_mode=persistent_delivery_mode)
        self.__channel().basic_publish(
            exchange="", routing_key=queue_name, body=message, properties=properties
        )

    def close(self):
        """
        Close the connection. This method is idempotent.
        """
        if self.__conn is None:
            return
        self.__conn.close()
        self.__conn = None

    def heartbeat(self):
        """
        Sends heartbeat
        """
        # There is no explicit send heartbeat frame on pika
        # https://github.com/pika/pika/issues/877
        # This time limit ends up being how long the function blocks
        # so it is better to keep it small x_x.
        timeout_sec = 1
        self.__check_conn()
        self.__conn.process_data_events(time_limit=timeout_sec)

    def reconnect(self):
        """
        Reconnects on rabbitmq
        """
        oldconn = self.__conn
        self.__chan = None
        self.__conn = None

        self.log.info("reconnecting")
        self.__conn = _connect_rabbitmq()
        self.log.info("reconnected with success, trying to close old connection")

        try:
            oldconn.close()
            self.log.info("closed old connection with success")
        except Exception as err:
            self.log.error(f"error disconnecting old connection:{err}")

    def channel(self):
        """
        Creates a new channel
        """
        self.__check_conn()
        return self.__conn.channel()

    def __channel(self):
        if self.__chan is None:
            self.__chan = self.channel()
        return self.__chan

    def __check_conn(self):
        if self.__conn is None:
            raise DisconnectedError(
                "Connection is disconnected, cant perform any operation"
            )


class Queue:
    """
    Queue abstraction using a RabbitMQ Blocking Connection.
    All methods will be synchronous.
    When the queue @max_size is achieved any call to push
    will block until space is freed on the queue.
    """

    def __init__(
        self, connection, name, max_size=10000, cache_enabled=True, cache_max_age=10.0
    ):
        if max_size <= 0:
            raise InvalidSizeError("Invalid size: {}".format(max_size))

        self._cache_enabled = cache_enabled
        self._lastlen_timestamp = 0
        self._lastlen = 0
        self._cache_max_age = cache_max_age
        self._name = name
        self._max_size = max_size
        self._connection = connection
        self._log = logging.getLogger(
            "rmqqueue.queue.{}".format(self.__class__.__name__)
        )

        self._log.debug("declaring queue")
        self._declare_queue()

    def pop(self):
        """
        Pops a message from the queue.
        It will return None if there is no message available.
        It won't block because this would mess up with the
        concurrency of the twisted based crawlers (one spider
        waiting for inputs would block all the processing).
        """
        return self._connection.basic_get(self._name)

    def push(self, message, block=True):
        """
        Pushes a message on the queue.
        The message must be a byte array.
        If the queue is at its maximum size it will block.

        It blocks because we want to stop all
        concurrency of the twisted based crawlers when the queue is full.

        Without blocking the spiders kept running and exhausted all free
        memory since they where not able to push results.
        If results can't be pushed, all work should stop.

        This is not awesome, but makes you think if the queue model is
        the best for dumping outputs.
        """
        try_again = 1.0

        if block:
            while self.len() >= self._max_size:
                time.sleep(try_again)

        self._connection.basic_publish(self._name, message)

    def len(self):
        """
        How much messages are on the queue.
        """
        if not self._cache_enabled:
            return self._len()

        now = time.time()
        if now - self._lastlen_timestamp < self._cache_max_age:
            return self._lastlen

        self._lastlen_timestamp = now
        self._lastlen = self._len()
        return self._lastlen

    def _len(self):
        # Reusing channel to declare again gives odd results
        # when you want to get the size of the queue
        channel = self._connection.channel()
        try:
            res = self._connection.declare_queue(
                self._name, passive=True, channel=channel
            )
            size = res.method.message_count
            self._log.debug("queue len: {}".format(size))
            return size
        finally:
            channel.close()

    def _declare_queue(self, passive=False):
        self._connection.declare_queue(self._name, passive)


def connect():
    """Connects on the queue broker and returns a connection instance"""
    return Connection(_connect_rabbitmq())


def get_queues_names(botname, provider):
    """
    Given the bot name returns the input and output queues
    """
    output_queue = f"{botname}.results"
    return f"bot.{provider}-{botname}", f"bot.{provider}-{output_queue}"


def _connect_rabbitmq():
    log = logging.getLogger("rmqqueue.queue.connection.rabbitmq")
    sd = service_discovery.new_from_env()
    urlparams = sd.rabbitmq_endpoint()
    max_conn_attempts = 30
    retry_delay_sec = 60
    heartbeat_interval_sec = 60
    urlparams += "?connection_attempts={}&retry_delay={}&heartbeat={}".format(
        max_conn_attempts, retry_delay_sec, heartbeat_interval_sec
    )
    log.info("connecting to rabbitmq[{}]".format(urlparams))
    return pika.BlockingConnection(pika.URLParameters(urlparams))
