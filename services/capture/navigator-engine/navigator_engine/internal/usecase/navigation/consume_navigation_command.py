from navigator_engine.internal.infra.repository.navigation_in_memory import (
    NavigationSessionInMemoryRepository,
)
from navigator_engine.internal.usecase.dtos.navigation_command_dto import (
    NavigationCommandDTO,
)


class ConsumeNavigationCommandUseCase:
    def __init__(
        self,
        repository: NavigationSessionInMemoryRepository,
    ):
        self.repository = repository

    def execute(self, navigation_id: str, dto: NavigationCommandDTO):
        session = self.repository.get(navigation_id)
        if not session:
            raise ValueError("Session not found")
        session.command_queue.put(dto)
        return {"status": "command enqueued"}
