from dataclasses import dataclass

from pydantic import BaseModel
from value_objects.emulator_id import EmulationID


@dataclass(frozen=True)
class EmulationScheduledDTO:
    """Data Transfer Object representing an emulation."""

    id: EmulationID
    emulator_sync: str
    emulation_domain: str
    timeout: int


class StartEmulatorDTO(BaseModel):
    """DTO for starting an emulation."""

    emulator_sync: str
    emulation_domain: str
    timeout: int
