# Fake Factory

The Fake Factory Library provides a collection of data generation factories designed to simulate realistic, synthetic data for testing, development, and feature store ingestion. Built on top of the [Faker](https://faker.readthedocs.io/) library, it offers a flexible base factory and specialized implementations that generate fraud-related records, such as device logs, transactions, and user profiles.

## Features

- **Extensible Base Factory:**
  The library defines a `BaseFakeFactory` interface that can be extended to create new factories with custom logic.

- **Realistic Data Generation:**
  Leveraging the Faker library, each factory produces synthetic yet realistic data, including names, emails, timestamps, and more.

- **Fraud Simulation:**
  Specialized factories (e.g., for device logs, transactions, and user profiles) implement fraud rules to simulate various risk scenarios, enabling testing of fraud detection systems and data pipelines.

- **Configurability:**
  Factories include configurable parameters (e.g., user ID ranges) and randomness to mimic real-world variability and edge cases.

## Installation

Add the Fake-Factory library to your monorepo by running:

```bash
npx nx run <project>:add --name fake-factory --local
```

Ensure that your environment includes the required dependencies (e.g., Faker) as defined in the `pyproject.toml` and `poetry.toml` files.

## Usage

### Base Factory

The `BaseFakeFactory` is the abstract base class that all specific factories extend. It defines the contract for generating fake records.

```python
from fake_factory.base_factory import BaseFakeFactory

class MyFactory(BaseFakeFactory):
    def generate(self) -> dict[str, Any]:
        # Implement record generation logic here.
        return {"dummy": "data"}
```

### Device Log Factory

The `DeviceLogFactory` generates fake device log records, including unique log IDs, device details, and timestamps. For example:

```python
from fake_factory.fraud.device_factory import DeviceLogFactory

factory = DeviceLogFactory()
device_log = factory.generate()
print(device_log)
```

### Transaction Factory

The `TransactionFakeFactory` simulates transaction data with optional fraud labeling. It applies conditional fraud rules to raw transaction data for realistic risk simulation:

```python
from fake_factory.fraud.transaction_factory import TransactionFakeFactory

transaction_factory = TransactionFakeFactory()
transaction = transaction_factory.generate(with_label=True)
print(transaction)
```

### User Profile Factory

The `UserProfileFactory` generates user profiles with unique IDs and calculates a risk level based on factors such as credit score, signup date, and country:

```python
from fake_factory.fraud.user_profile_factory import UserProfileFactory

profile_factory = UserProfileFactory()
user_profile = profile_factory.generate()
print(user_profile)
```

## Configuration Details

- **Data Realism:**
  Each factory uses the Faker library to produce data that closely resembles real-world records.
- **Fraud Rules:**
  The specialized fraud factories include multiple conditional branches to simulate different risk scenarios. For example, the TransactionFakeFactory can label transactions as fraudulent based on user compromise, card testing, or geographical anomalies.
- **User ID Management:**
  The UserProfileFactory maintains a thread-safe queue of user IDs to ensure unique identifiers across generated profiles.

## Testing

Unit tests are provided to validate the functionality and consistency of the data generators. To run the tests, navigate to the library’s directory and execute:

```bash
npx nx test fake-factory
```
