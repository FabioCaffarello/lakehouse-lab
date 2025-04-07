# Use Cases

The Use Cases Library provides core application logic that orchestrates various components like messaging producers, fake data generators, and storage clients to implement real-world business scenarios. A primary example is the **Start Emulator Use Case**, which starts an emulation process by coordinating between Kafka/Minio producers, data factories, and FastAPI's background tasks.

## Features

- **Abstract Sync Producer Interface:**
  Defines a uniform interface (`SyncProducer`) for synchronous message production across multiple systems (e.g., Kafka or Minio).

- **Producer Wrapper Implementations:**
  Includes concrete implementations for Kafka (`KafkaFactorySyncProducerWrapper`) and Minio (`MinioFactorySyncProducerWrapper`). These wrappers encapsulate system-specific resource setup and message production.

- **Flexible Data Emulation:**
  Uses various fake data factories to generate realistic transaction, device log, or user profile data, simulating actual operational data flows.

- **Background Task Scheduling:**
  Integrates with FastAPI's `BackgroundTasks` to schedule long-running emulation tasks in a non-blocking manner.

- **Resource Setup and Parallel Production:**
  Ensures that required resources (Kafka topics or Minio buckets) are created if missing. Supports parallel data production using multiple threads with proper synchronization and graceful shutdown using timers.

## Installation

Add the Use Cases library to your monorepo by running:

```bash
npx nx run <project>:add --name ddd-application-usecases --local
```

Ensure that all required dependencies (such as confluent-kafka, fastapi, Faker, and your logger library) are installed via your dependency manager (e.g., Poetry).

## Usage

### Instantiating Producer Wrappers

Depending on your infrastructure, instantiate the appropriate producer wrapper:

#### Kafka Producer Wrapper

```python
from producers.kafka.producer import KafkaProducerStrategy
from ddd.application.usecases.start_emulator import KafkaFactorySyncProducerWrapper

# Create a Kafka producer strategy instance (configure bootstrap servers, etc.)
kafka_producer = KafkaProducerStrategy(
    bootstrap_servers="localhost:9092",
    kafka_username="your_username",  # Optional, for SASL_SSL configuration
    kafka_password="your_password"   # Optional, for SASL_SSL configuration
)

# Wrap the Kafka producer
kafka_wrapper = KafkaFactorySyncProducerWrapper(
    kafka_producer=kafka_producer,
    kafka_brokers="localhost:9092"
)
```

#### Minio Producer Wrapper

```python
from storage.minio.storage import MinioStorageClient
from ddd.application.usecases.start_emulator import MinioFactorySyncProducerWrapper

# Initialize the Minio client with your Minio endpoint and credentials.
minio_client = MinioStorageClient(
    endpoint="minio.example.com",
    access_key="your_access_key",
    secret_key="your_secret_key",
    secure=False  # Set to True if using HTTPS
)

# Wrap the Minio client
minio_wrapper = MinioFactorySyncProducerWrapper(minio_client)
```

### Starting the Emulator

The **Start Emulator Use Case** coordinates the emulation start process. It:

- Determines the target resource (Kafka topic or Minio bucket) based on the domain.
- Retrieves the corresponding fake data factory.
- Schedules a background task to continuously produce messages using multiple parallel threads until the emulation timeout is reached.

#### Example

```python
from fastapi import FastAPI, BackgroundTasks
from ddd.application.usecases.start_emulator import StartEmulatorUseCase
from producers.kafka.producer import KafkaProducerStrategy
from storage.minio.storage import MinioStorageClient
from dtos.emulation_dto import StartEmulatorDTO

# Create your FastAPI app
app = FastAPI()

# Create instances for Kafka and Minio components.
kafka_producer = KafkaProducerStrategy(
    bootstrap_servers="localhost:9092",
    kafka_username="your_username",
    kafka_password="your_password"
)
minio_client = MinioStorageClient(
    endpoint="minio.example.com",
    access_key="your_access_key",
    secret_key="your_secret_key",
    secure=False
)

# Instantiate the use case with both producer implementations.
start_emulator_usecase = StartEmulatorUseCase(
    kafka_producer=kafka_producer,
    kafka_brokers="localhost:9092",
    minio_client=minio_client
)

@app.post("/start-emulator")
def start_emulator(dto: StartEmulatorDTO, background_tasks: BackgroundTasks):
    # Specify the number of parallel threads (e.g., 5)
    emulation_scheduled = start_emulator_usecase.execute(dto, background_tasks, num_threads=5)
    return emulation_scheduled
```

### Key Components

- **SyncProducer (Abstract Base Class):**
  Defines the contract for producers with methods like `produce()`, `flush()`, and `setup_resource()`. This ensures consistent behavior across different implementations.

- **Producer Wrappers:**

  - **KafkaFactorySyncProducerWrapper:**
    Uses Confluent Kafka's producer to send JSON messages and automatically creates topics if necessary.
  - **MinioFactorySyncProducerWrapper:**
    Uses Minio to upload messages as JSON objects into a bucket. Here, the `flush()` operation is a no-op.

- **Background Emulation Task:**
  The use case schedules an emulation task in the background. It spawns multiple threads that invoke `produce_data()` repeatedly until a specified timeout, then flushes the producer and logs the completion of the emulation.

## Configuration Details

- **Resource Mapping:**
  The use case internally maps emulation domains (e.g., "transaction", "user-profile", "device-log") to target topics or buckets. A default topic is used for unsupported domains.

- **Factory Mapping:**
  Associates each domain with the corresponding fake data factory to generate realistic records.

- **Parallel Processing:**
  Implements thread-based parallelism for high-throughput emulation. A global stop event and timer are used to gracefully shut down production.

## Testing

Unit tests are provided for this use case within the tests folder. The test suite verifies correct producer selection, resource setup, task scheduling, and proper execution of parallel data production.

To run the tests:

```bash
npx nx test ddd-application-usecases
```
