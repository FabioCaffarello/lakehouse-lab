from uuid import uuid4

from navigator_engine.internal.domain.navigation.entity import \
  NavigationSession
from navigator_engine.internal.usecase.dtos.navigation_command_dto import \
  NavigationCommandDTO
from navigator_engine.internal.usecase.dtos.navigation_session_dto import (
  NavigationSessionDto, StartNavigationSessionDTO)

)
from navigator_engine.internal.infra.repository.navigation_in_memory import \
  NavigationSessionInMemoryRepository
from navigator_engine.internal.service.session_runner import SessionRunner


class StartNavigationSessionUseCase:
    def __init__(
        self,
        repository: NavigationSessionInMemoryRepository,
    ):
        self.repository = repository

    def execute(self, dto: StartNavigationSessionDTO) -> NavigationSessionDto:
        session_id = str(uuid4())
        runner = SessionRunner(dto.engine)

        session = NavigationSession(
            id=session_id,
            engine=dto.engine,
            command_queue=runner.command_queue,
            response_queue=runner.response_queue,
            runner=runner,
        )

        self.repository.save(session)
        runner.start()

        return NavigationSessionDto(
            id=session.id,
        )

