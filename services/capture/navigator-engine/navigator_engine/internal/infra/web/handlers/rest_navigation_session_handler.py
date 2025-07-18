from fastapi import APIRouter
from navigator_engine.internal.infra.repository.navigation_in_memory import (
    NavigationSessionInMemoryRepository,
)
from navigator_engine.internal.usecase.dtos.navigation_command_dto import (
    NavigationCommandDTO,
)
from navigator_engine.internal.usecase.dtos.navigation_session_dto import (
    NavigationSessionDTO,
    StartNavigationSessionDTO,
)
from navigator_engine.internal.usecase.navigation.consume_navigation_command import (
    ConsumeNavigationCommandUseCase,
)
from navigator_engine.internal.usecase.navigation.start_navigation_session import (
    StartNavigationSessionUseCase,
)

router = APIRouter(prefix="/navigator", tags=["Navigator"])


def get_config(request: Request) -> Settings:
    """
    Dependency to get the application configuration.
    This function retrieves the configuration from the request's state.
    It is used as a dependency in FastAPI routes to access the configuration
    settings.
    Args:
        request (Request): The FastAPI request object.
    Returns:
        Settings: The application configuration settings.
    """
    return request.app.state.config


def get_repository(request: Request) -> InMemoryRepository:
    """
    Dependency to get the in-memory repository.
    This function retrieves the repository from the request's state.
    It is used as a dependency in FastAPI routes to access the repository
    instance.
    Args:
        request (Request): The FastAPI request object.
    Returns:
        InMemoryRepository: The in-memory repository instance.
    """
    return request.app.state.repository


@router.post(
    "/start", response_model=NavigationSessionDTO, status_code=HTTPStatus.CREATED
)
def create_navigation_session(
    dto: StartNavigationSessionDTO,
    repository: NavigationSessionInMemoryRepository = Depends(get_repository),
):
    try:
        use_case = StartNavigationSessionUseCase(repository)
        return use_case.execute(dto)

    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"Error creating navigation session: {str(e)}",
        ) from e


@router.post("session/{navigation_id}/command", status_code=HTTPStatus.OK)
def send_navigation_command(
    navigation_id: str,
    dto: NavigationCommandDTO,
    repository: NavigationSessionInMemoryRepository = Depends(get_repository),
):
    try:
        use_case = ConsumeNavigationCommandUseCase(repository)
        return use_case.execute(navigation_id, dto)

    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"Error sending navigation command: {str(e)}",
        ) from e
