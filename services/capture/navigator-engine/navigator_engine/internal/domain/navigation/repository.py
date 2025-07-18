from abc import ABC, abstractmethod


class NavigationRepository(ABC):
    @abstractmethod
    def save(self, session): ...

    @abstractmethod
    def get(self, id): ...

    @abstractmethod
    def delete(self, id): ...
