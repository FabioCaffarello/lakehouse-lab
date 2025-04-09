from http import HTTPStatus

from dtos.emulation_dto import EmulationScheduledDTO, StartEmulatorDTO
from emulator_settings.settings import Settings
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from producers.kafka.producer import KafkaProducerStrategy
from storage.minio.storage import MinioStorageClient
from usecases.start_emulator import StartEmulatorUseCase

router = APIRouter(prefix="/emulator", tags=["Emulator"])


def get_config(request: Request) -> Settings:
    return request.app.state.config


def get_minio_client(
    config: Settings = Depends(get_config),
) -> MinioStorageClient:  # noqa: B008
    return MinioStorageClient(
        endpoint=config.minio_endpoint,
        access_key=config.minio_access_key,
        secret_key=config.minio_secret_key,
        secure=config.minio_secure,
    )


def get_kafka_producer(
    config: Settings = Depends(get_config),
) -> KafkaProducerStrategy:  # noqa: B008
    return KafkaProducerStrategy(
        bootstrap_servers=config.kafka_bootstrap_servers,
        kafka_username=config.kafka_username,
        kafka_password=config.kafka_password,
    )


def get_start_emulator_usecase(
    config: Settings = Depends(get_config),  # noqa: B008
    kafka_producer: KafkaProducerStrategy = Depends(get_kafka_producer),  # noqa: B008
    minio_client: MinioStorageClient = Depends(get_minio_client),  # noqa: B008
) -> StartEmulatorUseCase:
    return StartEmulatorUseCase(
        kafka_producer=kafka_producer,
        kafka_brokers=config.kafka_bootstrap_servers,
        minio_client=minio_client,
    )


@router.post("/", response_model=EmulationScheduledDTO, status_code=201)
def generate_emulation(
    dto: StartEmulatorDTO,
    background_tasks: BackgroundTasks,
    usecase: StartEmulatorUseCase = Depends(get_start_emulator_usecase),  # noqa: B008
):
    try:
        return usecase.execute(dto, background_tasks, num_threads=5)
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST, detail=str(e)) from e
