from abc import ABC, abstractmethod
from typing import Callable, Optional


class BaseProducer(ABC):
    @abstractmethod
    def produce(
        self, topic: str, key: str, value: dict, callback: Optional[Callable] = None
    ) -> None:
        pass

    @abstractmethod
    def flush(self, timeout: int = 30) -> None:
        pass

    @abstractmethod
    def get_producer(self):
        pass
