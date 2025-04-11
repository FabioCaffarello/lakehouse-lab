from http import HTTPStatus

from dtos.emulation_dto import EmulationScheduledDTO, StartEmulatorDTO
from emulator_settings.settings import Settings
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from mem_repository.in_memory_repository import InMemoryRepository
from producers.kafka.producer import KafkaProducerStrategy
from storage.minio.storage import MinioStorageClient
from usecases.start_emulator import StartEmulatorUseCase
from usecases.status_emulation import StatusEmulatorUseCase

router = APIRouter(prefix="/emulator", tags=["Emulator"])


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


def get_minio_client(
    config: Settings = Depends(get_config),
) -> MinioStorageClient:  # noqa: B008
    """
    Dependency to get the MinIO storage client.
    This function creates and returns a MinIO storage client instance
    using the configuration settings provided.
    Args:
        config (Settings): The application configuration settings.
    Returns:
        MinioStorageClient: The MinIO storage client instance.
    """
    return MinioStorageClient(
        endpoint=config.minio_endpoint,
        access_key=config.minio_access_key,
        secret_key=config.minio_secret_key,
        secure=config.minio_secure,
    )


def get_kafka_producer(
    config: Settings = Depends(get_config),
) -> KafkaProducerStrategy:  # noqa: B008
    """
    Dependency to get the Kafka producer.
    This function creates and returns a Kafka producer instance
    using the configuration settings provided.
    Args:
        config (Settings): The application configuration settings.
    Returns:
        KafkaProducerStrategy: The Kafka producer instance.
    """
    return KafkaProducerStrategy(
        bootstrap_servers=config.kafka_bootstrap_servers,
        kafka_username=config.kafka_username,
        kafka_password=config.kafka_password,
    )


def get_start_emulator_usecase(
    config: Settings = Depends(get_config),  # noqa: B008
    kafka_producer: KafkaProducerStrategy = Depends(get_kafka_producer),  # noqa: B008
    minio_client: MinioStorageClient = Depends(get_minio_client),  # noqa: B008
    repository: InMemoryRepository = Depends(get_repository),  # noqa: B008
) -> StartEmulatorUseCase:
    """
    Dependency to get the StartEmulatorUseCase instance.
    This function creates and returns an instance of the StartEmulatorUseCase
    using the configuration settings, Kafka producer, and MinIO client provided.
    Args:
        config (Settings): The application configuration settings.
        kafka_producer (KafkaProducerStrategy): The Kafka producer instance.
        minio_client (MinioStorageClient): The MinIO storage client instance.
        repository (InMemoryRepository): The in-memory repository instance.
    Returns:
        StartEmulatorUseCase: The StartEmulatorUseCase instance.
    """
    return StartEmulatorUseCase(
        kafka_producer=kafka_producer,
        kafka_brokers=config.kafka_bootstrap_servers,
        minio_client=minio_client,
        repository=repository,
    )


def get_status_emulator_usecase(
    repository: InMemoryRepository = Depends(get_repository),  # noqa: B008
) -> StatusEmulatorUseCase:
    """
    Dependency to get the StatusEmulatorUseCase instance.
    This function creates and returns an instance of the StatusEmulatorUseCase
    using the configuration settings, Kafka producer, and MinIO client provided.
    Args:
        repository (InMemoryRepository): The in-memory repository instance.
    Returns:
        StatusEmulatorUseCase: The StatusEmulatorUseCase instance.
    """
    return StatusEmulatorUseCase(repository=repository)


@router.post("/", response_model=EmulationScheduledDTO, status_code=201)
def generate_emulation(
    dto: StartEmulatorDTO,
    background_tasks: BackgroundTasks,
    usecase: StartEmulatorUseCase = Depends(get_start_emulator_usecase),  # noqa: B008
):
    """
    Endpoint to start the emulator.
    This endpoint receives a StartEmulatorDTO object, processes it using the
    StartEmulatorUseCase, and returns an EmulationScheduledDTO object.
    Args:
        dto (StartEmulatorDTO): The data transfer object containing the
            emulation parameters.
        background_tasks (BackgroundTasks): FastAPI background tasks
            instance for handling background tasks.
        usecase (StartEmulatorUseCase): The use case instance for starting
            the emulator.
    Returns:
        EmulationScheduledDTO: The data transfer object containing the
            emulation scheduling result.
    Raises:
        HTTPException: If there is an error during the emulation process.
    """
    try:
        return usecase.execute(dto, background_tasks, num_threads=5)
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=str(e)) from e


@router.get("/{emulation_id}/status")
def get_emulation_status(
    emulation_id: str,
    repository: InMemoryRepository = Depends(get_repository),
):
    usecase = get_status_emulator_usecase(repository=repository)
    try:
        return usecase.execute(emulation_id)
    except ValueError as e:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=str(e)
        ) from e
