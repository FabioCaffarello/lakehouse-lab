from abc import ABC, abstractmethod
from typing import Any


class BaseFakeFactory(ABC):
    @abstractmethod
    def generate(self) -> dict[str, Any]:
        """Generates a fake data record."""
        pass
