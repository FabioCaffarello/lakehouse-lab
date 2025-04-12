from dtos.emulation_dto import EmulationStatusDTO, StatusDTO
from logger.log import get_logger_from_env
from mem_repository.in_memory_repository import InMemoryRepository

logger = get_logger_from_env(__name__)


class StatusEmulatorUseCase:
    """
    Use case for checking the status of the emulator.
    This use case checks if the emulator is running and returns its status.
    """

    def __init__(self, repository: InMemoryRepository):
        self.repository = repository

    def execute(self, emulation_id: str) -> EmulationStatusDTO:
        """
        Execute the use case to check the status of the emulator.
        Returns a dictionary containing the status of the emulator.
        """
        logger.info("Checking emulator status...")
        status = self.repository.get_status(emulation_id)
        if status is None:
            logger.error(f"Emulation ID {emulation_id} not found.")
            raise ValueError(f"Emulation ID {emulation_id} not found.")
        return EmulationStatusDTO(id=emulation_id, status=StatusDTO(**status))
