import uuid
from dataclasses import dataclass


@dataclass(frozen=True)
class EmulationID:
    """Value Object representing an emulation's unique identifier."""

    value: str

    def __post_init__(self):
        """Ensure the ID is a valid UUID."""
        try:
            uuid.UUID(self.value)  # Validate UUID format
        except ValueError:
            raise ValueError(f"Invalid EmulationID: {self.value}") from None

    @classmethod
    def generate(cls) -> "EmulationID":
        """Generate a new AgentID."""
        return cls(value=str(uuid.uuid4()))
