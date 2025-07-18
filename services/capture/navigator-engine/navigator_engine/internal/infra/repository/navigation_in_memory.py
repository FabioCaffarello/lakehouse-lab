from navigator_engine_internal.domain.navigation.entity import NavigationSession
from navigator_engine_internal.domain.navigation.repository import NavigationRepository


class NavigationSessionInMemoryRepository(NavigationRepository):
    def __init__(self):
        self._storage = {}

    def save(self, session: NavigationSession):
        self._storage[session.id] = session

    def get(self, id: str) -> NavigationSession:
        return self._storage.get(id)

    def delete(self, id: str):
        self._storage.pop(id, None)
