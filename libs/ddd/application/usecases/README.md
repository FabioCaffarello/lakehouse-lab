# Use Cases

The Use Cases Library encapsulates the core business logic of your application. It orchestrates multiple components—such as messaging producers, fake data generators, and storage clients—to implement real-world scenarios. A prime example is the **Start Emulator Use Case**, which initiates an emulation process by coordinating between Kafka or Minio producers, data factories, and background tasks provided by FastAPI.

## Features

- **Abstract Sync Producer Interface:**
  The library defines a consistent interface, `SyncProducer`, which standardizes methods like `produce()`, `flush()`, and `setup_resource()` for synchronous message production. This abstraction allows seamless integration with different backend systems (e.g., Kafka or Minio).

- **Producer Wrapper Implementations:**
  The library includes concrete producer wrappers:

  - **KafkaFactorySyncProducerWrapper:**
    Uses Confluent Kafka’s producer to send JSON messages. It automatically creates topics if they do not exist.
  - **MinioFactorySyncProducerWrapper:**
    Wraps a Minio client to upload JSON or CSV messages as objects into a bucket. The implementation supports two modes—“grouped” and “chunked”—with proper buffering and flushing mechanisms.

- **Flexible Data Emulation:**
  By leveraging various fake data factories, the use cases generate realistic data for domains such as transactions, device logs, or user profiles. This feature is useful for testing, simulating operational environments, or batch processing.

- **Background Task Scheduling:**
  The use case integrates with FastAPI’s `BackgroundTasks` to schedule long-running, non-blocking emulation tasks. This allows continuous data production without impacting the responsiveness of your main API.

- **Resource Setup and Parallel Production:**
  The use case:
  - Automatically sets up required resources (e.g., creates Kafka topics or Minio buckets) if they are not already provisioned.
  - Supports parallel data production by spawning multiple threads. A global stop event and timer ensure a graceful shutdown once a configured timeout is reached.

## Installation

To include the Use Cases Library in your monorepo, run the following command:

```bash
npx nx run <project>:add --name ddd-application-usecases --local
```

Ensure that all necessary dependencies (e.g., `confluent-kafka`, `fastapi`, `Faker`, your logger library, etc.) are installed via your dependency manager (such as Poetry).

## Usage

### Instantiating Producer Wrappers

Choose the appropriate producer wrapper based on your infrastructure:

#### Kafka Producer Wrapper

```python
from producers.kafka.producer import KafkaProducerStrategy
from ddd.application.usecases.start_emulator import KafkaFactorySyncProducerWrapper

# Configure your Kafka producer strategy (set bootstrap servers, credentials, etc.)
kafka_producer = KafkaProducerStrategy(
    bootstrap_servers="localhost:9092",
    kafka_username="your_username",   # Optional, for SASL_SSL configuration
    kafka_password="your_password"    # Optional, for SASL_SSL configuration
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

# Initialize the Minio client using your endpoint and credentials.
minio_client = MinioStorageClient(
    endpoint="minio.example.com",
    access_key="your_access_key",
    secret_key="your_secret_key",
    secure=False  # Set True if using HTTPS.
)

# Wrap the Minio client.
minio_wrapper = MinioFactorySyncProducerWrapper(minio_client)
```

### Starting the Emulator

The **Start Emulator Use Case** coordinates the emulation process by:

- Determining the target resource (Kafka topic or Minio bucket) based on the specified domain.
- Selecting the correct fake data factory for generating realistic records.
- Scheduling a background task that spawns multiple threads to continuously produce data until the emulation timeout is reached.

#### Example (with FastAPI)

```python
from fastapi import FastAPI, BackgroundTasks
from ddd.application.usecases.start_emulator import StartEmulatorUseCase
from producers.kafka.producer import KafkaProducerStrategy
from storage.minio.storage import MinioStorageClient
from dtos.emulation_dto import StartEmulatorDTO

# Create your FastAPI application.
app = FastAPI()

# Instantiate Kafka and Minio components.
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

# Create the Start Emulator Use Case.
start_emulator_usecase = StartEmulatorUseCase(
    kafka_producer=kafka_producer,
    kafka_brokers="localhost:9092",
    minio_client=minio_client
)

@app.post("/start-emulator")
def start_emulator(dto: StartEmulatorDTO, background_tasks: BackgroundTasks):
    # Specify the number of parallel threads (e.g., 5).
    emulation_scheduled = start_emulator_usecase.execute(dto, background_tasks, num_threads=5)
    return emulation_scheduled
```

### Key Components

- **SyncProducer (Abstract Base Class):**
  Establishes a common contract for synchronous message producers via methods such as `produce()`, `flush()`, and `setup_resource()`. This abstraction provides consistency across different messaging systems.

- **Producer Wrappers:**

  - **KafkaFactorySyncProducerWrapper:**
    Leverages Confluent Kafka’s producer to send JSON payloads and automatically creates topics if missing.
  - **MinioFactorySyncProducerWrapper:**
    Uses a Minio client to upload messages (as JSON or CSV) to a bucket. It supports grouped or chunked buffering with automatic flushing.

- **Background Emulation Task:**
  The use case schedules a background task that spawns multiple threads. Each thread repeatedly produces messages using a fake data factory until a specified timeout triggers a graceful stop.

- **Resource and Factory Mapping:**
  The use case includes internal mappings that associate emulation domains (e.g., “transaction”, “user-profile”, “device-log”) with target topics/buckets and their respective fake data factories.

## Configuration Details

- **Resource Mapping:**
  The emulator maps different emulation domains to corresponding target resources (Kafka topics or Minio buckets). A default resource is used for domains that are not explicitly supported.

- **Fake Data Factories:**
  Each domain (e.g., "transaction", "device-log", etc.) is associated with a fake data factory that generates realistic records, ensuring the emulation closely resembles actual operational data flows.

- **Parallel Processing:**
  The use case supports high-throughput production through multi-threading. A stop event and timer guarantee that production terminates gracefully after the configured timeout.

## Testing

The repository includes a comprehensive test suite covering:

- Producer wrapper selection and resource setup.
- Correct execution of background tasks and parallel data production.
- Validation of the emulation logic and fake data generation.

To run the tests:

```bash
npx nx test ddd-application-usecases
```
