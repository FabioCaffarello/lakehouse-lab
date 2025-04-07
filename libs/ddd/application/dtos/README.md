# DTOs

The DTOs (Data Transfer Objects) Library provides structured representations of emulation data for your application. It simplifies data transfer between different layers and ensures data consistency and validation across the system.

## Features

- **Immutable Data Structures:**
  The `EmulationScheduledDTO` is implemented as a frozen dataclass, ensuring that once created, its values remain unchanged.

- **Data Validation:**
  The `StartEmulatorDTO` leverages Pydantic's `BaseModel` to validate and parse input data for starting an emulation.

- **Consistent Data Transfer:**
  Both DTOs encapsulate essential information about an emulation, including synchronization details, domain, timeout settings, and a unique identifier.

## Installation

Add the DTOs library to your monorepo by running:

```bash
npx nx run <project>:add --name ddd-application-dtos --local
```

Ensure that your environment includes all required dependencies such as `pydantic`.

## Usage

### EmulationScheduledDTO

The `EmulationScheduledDTO` is a frozen dataclass representing an emulation's scheduled details. It includes the following fields:

- **id:** An `EmulationID` value object representing the unique identifier of the emulation.
- **emulator_sync:** A string indicating the synchronization details.
- **emulation_domain:** A string specifying the emulation domain.
- **timeout:** An integer value representing the timeout duration.

**Example:**

```python
from dtos.emulation_dto import EmulationScheduledDTO
from value_objects.emulator_id import EmulationID

# Create an EmulationScheduledDTO instance
emulation_dto = EmulationScheduledDTO(
    id=EmulationID.generate(),
    emulator_sync="sync_value",
    emulation_domain="domain_value",
    timeout=30
)

print(emulation_dto)
```

### StartEmulatorDTO

The `StartEmulatorDTO` is a Pydantic model used for starting an emulation. It validates the following fields:

- **emulator_sync:** A string indicating synchronization details.
- **emulation_domain:** A string specifying the emulation domain.
- **timeout:** An integer value representing the timeout duration.

**Example:**

```python
from dtos.emulation_dto import StartEmulatorDTO

# Define data for starting an emulation
data = {
    "emulator_sync": "sync_value",
    "emulation_domain": "domain_value",
    "timeout": 30
}

# Parse and validate the data using StartEmulatorDTO
start_dto = StartEmulatorDTO(**data)
print(start_dto)
```

## Configuration Details

- **Immutable DTO:**
  `EmulationScheduledDTO` is implemented with `@dataclass(frozen=True)` to ensure immutability, promoting data integrity across your application.

- **Robust Validation:**
  `StartEmulatorDTO` uses Pydantic's powerful data validation and parsing features to ensure that only valid data is processed when starting an emulation.

## Testing

Unit tests are not included in this library. However, can be created if needed (remember to edit the test command in the project.json to not pass in failures). To run the tests, navigate to the library directory and execute:

```bash
npx nx test ddd-application-dtos
```
