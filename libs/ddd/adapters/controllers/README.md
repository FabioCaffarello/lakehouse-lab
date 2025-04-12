# Controllers

The Controllers Library encapsulates your HTTP endpoints, providing a RESTful interface for triggering and managing emulator processes. Built on top of [FastAPI](https://fastapi.tiangolo.com/), the library leverages dependency injection to seamlessly integrate configuration settings, storage clients, and producer strategies into your application. This ensures that your emulator use case is easily accessible via HTTP while maintaining a clean separation of concerns.

## Features

- **RESTful Endpoints:**
  Exposes endpoints (e.g., POST `/emulator`) that accept input via DTOs and return structured responses, enabling external clients to trigger emulator processes.

- **Dependency Injection:**
  Uses FastAPI’s dependency injection system to automatically obtain configuration parameters and instantiate required dependencies such as Kafka producers, Minio storage clients, and use cases.

- **Centralized Error Handling:**
  Employs HTTP exceptions with appropriate status codes to manage errors and communicate issues clearly to API consumers.

- **Integration with Background Tasks:**
  Schedules emulation tasks in the background using FastAPI's BackgroundTasks, ensuring non-blocking request handling during long-running emulation processes.

## Installation

Add the Controllers library to your monorepo by running:

```bash
npx nx run <project>:add --name ddd-application-controllers --local
```

Ensure that all required dependencies (e.g., FastAPI, confluent-kafka, Faker, and your logger library) are installed via your dependency manager (such as Poetry).

## Usage

### Configuration and Dependency Injection

The controllers rely on FastAPI dependency injection to supply configuration settings (via a custom `Settings` model) and to instantiate needed clients:

- **get_config:** Retrieves the application’s configuration from the FastAPI app state.
- **get_minio_client:** Instantiates a `MinioStorageClient` using configuration values.
- **get_kafka_producer:** Instantiates a `KafkaProducerStrategy` using configuration values.
- **get_start_emulator_usecase:** Combines the above dependencies to construct the `StartEmulatorUseCase`.

### Endpoints

The library defines an APIRouter under the `/emulator` prefix with one key endpoint:

#### POST `/emulator`

- **Description:**
  Triggers the emulator process by accepting a `StartEmulatorDTO` payload and scheduling a background task that produces data using the appropriate producer (Kafka or Minio).

- **Request Body:**
  Expects a DTO matching `StartEmulatorDTO`, which includes parameters such as emulator synchronization type, emulation domain, and timeout.

- **Response:**
  Returns an `EmulationScheduledDTO` response containing the scheduled emulation details (including a unique emulation ID).

- **Example Request:**

  ```http
  POST /emulator HTTP/1.1
  Content-Type: application/json

  {
      "emulator_sync": "kafka",
      "emulation_domain": "transaction",
      "timeout": 60
  }
  ```

- **Example Response:**

  ```json
  {
    "id": "generated-uuid-string",
    "emulator_sync": "kafka",
    "emulation_domain": "transaction",
    "timeout": 60
  }
  ```

```http
GET /emulator/<emulation_id>/status HTTP/1.1
```

- **Example Response:**

```json
{
  "id": "694a9cee-c9e9-4999-9a72-77e5817ca0a3",
  "status": {
    "global_status": "completed",
    "threads": {
      "0": "finished",
      "1": "finished",
      "2": "finished",
      "3": "finished",
      "4": "finished"
    }
  }
}
```

### Integration Example

Here’s a sample integration that uses the Controllers library within a FastAPI application:

```python
from fastapi import FastAPI
from controllers.emulator_controller import router as emulator_router

app = FastAPI()
app.state.config = ...  # Initialize your Settings instance here.

# Include the emulator endpoints
app.include_router(emulator_router)
```

## Configuration Details

- **Settings:**
  The controllers depend on a `Settings` class that holds configuration values such as Kafka bootstrap servers, Minio endpoints, and authentication credentials.

- **Dependency Mapping:**
  The endpoint uses dependency providers to instantiate:

  - A Minio storage client (`MinioStorageClient`),
  - A Kafka producer strategy (`KafkaProducerStrategy`),
  - A unified use case (`StartEmulatorUseCase`) that orchestrates background data emulation tasks.

- **Background Task Scheduling:**
  Emulation tasks are scheduled using FastAPI’s `BackgroundTasks`, enabling asynchronous processing of data production without blocking API responses.

## Testing

Unit tests for the Controllers library are provided and can be executed using your CI command:

```bash
npx nx test ddd-application-controllers
```
