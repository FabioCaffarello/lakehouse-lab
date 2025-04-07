import json

from confluent_kafka import Producer
from logger.log import get_logger_from_env
from producers.base_producer import BaseProducer

logger = get_logger_from_env(__name__)


class KafkaProducerStrategy(BaseProducer):
    def __init__(
        self,
        bootstrap_servers: str,
        kafka_username: str = None,
        kafka_password: str = None,
    ):
        self.config = {
            "bootstrap.servers": bootstrap_servers,
            "client.id": "emulator-producer",
            "compression.type": "gzip",
            "queue.buffering.max.messages": 100000,
            "queue.buffering.max.kbytes": 512000,
            "batch.num.messages": 1000,
            "linger.ms": 10,
            "acks": 1,
            "batch.size": 16384,
        }
        if kafka_username and kafka_password:
            self.config.update(
                {
                    "sasl.mechanisms": "PLAIN",
                    "security.protocol": "SASL_SSL",
                    "sasl.username": kafka_username,
                    "sasl.password": kafka_password,
                }
            )
        else:
            self.config.update({"security.protocol": "PLAINTEXT"})
        self.producer = Producer(self.config)

    def delivery_report(self, err, msg):
        if err is not None:
            logger.error(f"Failed to deliver message: {err}")
        else:
            logger.info(
                f"Message '{msg.key()}' delivered to {msg.topic()} [{msg.partition()}]"
            )

    def produce(self, topic: str, key: str, value: dict):
        try:
            self.producer.produce(
                topic,
                key=key,
                value=json.dumps(value).encode("utf-8"),
                callback=self.delivery_report,
            )
            self.producer.poll(0)
            logger.info(f"Producing message to topic {topic} with key {key}")
        except Exception as e:
            logger.error(f"Erro ao produzir mensagem: {e}")
            raise e

    def get_producer(self):
        return self.producer

    def flush(self, timeout: int = 30):
        self.producer.flush(timeout)
