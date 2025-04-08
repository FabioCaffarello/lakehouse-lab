# Entities

The Entities Library provides domain entities that encapsulate business logic and data for your application. It currently includes the `Emulation` entity, which represents an emulation instance with a unique identifier, a timeout value, an emulator type, and a timestamp indicating when it was created.

## Features

- **Unique Identification:**
  Each `Emulation` entity is assigned a unique identifier using the `EmulationID` value object. This ensures that every emulation instance can be uniquely referenced.

- **Automatic Timestamping:**
  The entity records its creation time (`created_at`) automatically using the current UTC datetime.

- **Flexible Data Structure:**
  The `Emulation` entity includes core attributes such as `timeout` and `emulator_type`, and it can be easily extended to accommodate additional properties.

- **Easy Serialization:**
  The `to_dict` method converts the entity to a dictionary, making it simple to serialize data for APIs, logging, or other integrations.

## Installation

Add the Entities library to your monorepo by running:

```bash
npx nx run <project>:add --name ddd-entities --local
```

## Usage

### Creating an Emulation Entity

To create an instance of an `Emulation` entity, simply import the class and instantiate it with the required parameters:

```python
from entities.emulation import Emulation

# Create an Emulation entity with a timeout of 30 and a specified emulator type.
emulation = Emulation(timeout=30, emulator_type="test_emulator")
print(emulation.to_dict())
```

### Understanding the Attributes

- **id:**
  A unique identifier automatically generated using the `EmulationID` value object.

- **timeout:**
  An integer representing the timeout period for the emulation.

- **emulator_type:**
  A string specifying the type of emulator.

- **created_at:**
  A UTC timestamp indicating when the emulation was created.

## Testing

Unit tests are included to ensure that the `Emulation` entity behaves as expected. To run the tests, navigate to the library directory and execute:

```bash
npx nx test ddd-entities
```
