# Value Objects

The Value Objects Library provides a set of immutable objects to represent domain values consistently and reliably. It includes the `EmulationID` value object, which encapsulates a unique identifier for emulation instances using a UUID format.

## Features

- **Immutable Data Structures:** Uses Python’s `@dataclass(frozen=True)` to ensure immutability.
- **UUID Validation:** Automatically validates that any provided identifier conforms to the UUID format.
- **Convenience Method:** Includes a class method to generate a new, valid `EmulationID`.

## Installation

```bash
npx nx run <project>:add --name ddd-value-objects --local
```

## Usage

### Creating an EmulationID

Instantiate an `EmulationID` with a valid UUID string:

```python
from value_objects.emulation_id import EmulationID

# Create an EmulationID using a valid UUID string
emulation_id = EmulationID("123e4567-e89b-12d3-a456-426614174000")
print(emulation_id.value)
```

### Generating a New EmulationID

Generate a new unique `EmulationID` using the provided class method:

```python
from value_objects.emulation_id import EmulationID

# Generate a new EmulationID
new_id = EmulationID.generate()
print(new_id.value)
```

### Handling Invalid IDs

If an invalid UUID is provided, the class raises a `ValueError` during initialization:

```python
from value_objects.emulation_id import EmulationID

try:
    invalid_id = EmulationID("invalid-uuid")
except ValueError as e:
    print(e)  # Output: "Invalid EmulationID: invalid-uuid"
```

## Testing

Unit tests are provided to ensure that the value objects behave as expected. To run the tests, navigate to the `libs/shared/value-objects` directory and execute:

```bash
npx nx test ddd-value-objects
```
