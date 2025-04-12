from dataclasses import dataclass

from pydantic import BaseModel
from value_objects.emulator_id import EmulationID


@dataclass(frozen=True)
class EmulationScheduledDTO:
    """Data Transfer Object representing an emulation."""

    id: EmulationID
    emulator_sync: str
    format_type: str
    sync_type: str
    emulation_domain: str
    max_chunk_size: int
    timeout: int


class StartEmulatorDTO(BaseModel):
    """DTO for starting an emulation."""

    emulator_sync: str
    format_type: str
    sync_type: str
    max_chunk_size: int
    emulation_domain: str
    max_chunk_size: int
    timeout: int


@dataclass(frozen=True)
class StatusDTO:
    """Data Transfer Object representing the status of an emulation."""

    global_status: str
    threads: dict[str, str]


@dataclass(frozen=True)
class EmulationStatusDTO:
    """Data Transfer Object representing the status of an emulation."""

    id: EmulationID
    status: StatusDTO
