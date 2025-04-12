# DTOs

The DTOs Library provides structured representations of emulation data, streamlining communication between different layers of your application. It ensures data consistency and integrity through the use of immutable data classes and robust data validation.

## Overview

This library includes several DTOs:

- **EmulationScheduledDTO:** An immutable data class representing the scheduled details of an emulation.
- **StartEmulatorDTO:** A Pydantic model that validates and parses the input data for initiating an emulation.
- **StatusDTO:** An immutable data class representing the overall status of an emulation.
- **EmulationStatusDTO:** An immutable data class encapsulating an emulation identifier along with its status details.

## Features

- **Immutable Data Structures:**
  The `EmulationScheduledDTO`, `StatusDTO`, and `EmulationStatusDTO` are implemented as frozen dataclasses. Once instantiated, their values cannot be modified, ensuring data integrity across the system.

- **Robust Input Validation:**
  The `StartEmulatorDTO` leverages Pydantic’s `BaseModel` to enforce type checking and validate input data when starting an emulation.

- **Consistent Data Transfer:**
  Each DTO encapsulates essential details such as synchronization settings, domain information, file format type, timeout settings, and unique identifiers (where applicable).

## Installation

To add the DTOs library to your monorepo, run the following command:

```bash
npx nx run <project>:add --name ddd-application-dtos --local
```

Make sure that the required dependencies (e.g., `pydantic`) are included in your environment.

## DTO Details

### EmulationScheduledDTO

An immutable dataclass representing the scheduled details of an emulation. This DTO carries comprehensive information about an emulation and is defined as follows:

- **id:** An `EmulationID` value object representing the unique identifier of the emulation.
- **emulator_sync:** A string that indicates synchronization details.
- **format_type:** A string that specifies the file format.
- **sync_type:** A string that indicates the type of synchronization.
- **emulation_domain:** A string representing the emulation domain.
- **max_chunk_size:** An integer representing the maximum size of data chunks.
- **timeout:** An integer that defines the timeout duration in seconds.

**Example:**

```python
from dtos.emulation_dto import EmulationScheduledDTO
from value_objects.emulator_id import EmulationID

# Create an instance of EmulationScheduledDTO
emulation_dto = EmulationScheduledDTO(
    id=EmulationID.generate(),
    emulator_sync="sync_value",
    format_type="json",
    sync_type="grouped",
    emulation_domain="domain_value",
    max_chunk_size=1024,
    timeout=30
)

print(emulation_dto)
```

### StartEmulatorDTO

A Pydantic model used for validating and parsing input data when starting an emulation. The model ensures that only correctly formatted data is used to initiate the process.

- **emulator_sync:** A string indicating synchronization details.
- **format_type:** A string representing the file format.
- **sync_type:** A string indicating the synchronization strategy.
- **emulation_domain:** A string specifying the emulation domain.
- **max_chunk_size:** An integer that denotes the maximum size of data chunks.
- **timeout:** An integer specifying the timeout duration.

**Example:**

```python
from dtos.emulation_dto import StartEmulatorDTO

# Data dictionary for starting an emulation
data = {
    "emulator_sync": "sync_value",
    "format_type": "json",
    "sync_type": "grouped",
    "emulation_domain": "domain_value",
    "max_chunk_size": 1024,
    "timeout": 30
}

# Validate and parse the input data
start_dto = StartEmulatorDTO(**data)
print(start_dto)
```

### StatusDTO

An immutable dataclass representing the status of an emulation. It contains two important pieces of information:

- **global_status:** A string summarizing the overall status.
- **threads:** A dictionary where each key is a thread identifier and the value is a string representing its status.

### EmulationStatusDTO

This immutable dataclass encapsulates an emulation's unique identifier along with its corresponding status, which is represented using the `StatusDTO`:

- **id:** An `EmulationID` value object that uniquely identifies the emulation.
- **status:** An instance of `StatusDTO` that describes the overall status and thread-specific statuses.

## Configuration and Best Practices

- **Immutability:**
  Using `@dataclass(frozen=True)` for several DTOs ensures that their instances remain immutable, thereby promoting data integrity throughout the application.

- **Validation:**
  Employing Pydantic’s `BaseModel` for the `StartEmulatorDTO` ensures robust input validation. This guards against erroneous data from external sources and helps maintain system reliability.

- **Consistent Data Transfer:**
  By using these DTOs, the library standardizes data representation across different layers of the application, simplifying both integration and maintenance.

## Testing

Unit tests are not included in the library by default, but you can create them as needed. To run tests for the library, navigate to the project directory and execute:

```bash
npx nx test ddd-application-dtos
```

Remember to adjust your testing configurations (for example, in `project.json`) so that test failures do not halt your build process if needed.
