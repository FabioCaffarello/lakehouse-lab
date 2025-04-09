# API

The API provides an HTTP interface for interacting with the Emulator Service. Built on [FastAPI](https://fastapi.tiangolo.com/), it leverages modular controllers to coordinate use cases, dependency injection to streamline configuration and resource instantiation, and background tasks to offload long-running emulation processes.

## Features

- **RESTful Interface:**
  Exposes endpoints to trigger and manage emulation processes. A dedicated `/emulator` endpoint (provided by the controllers library) allows external clients to initiate emulator workflows.

- **Modular Architecture:**
  Organized into controllers and use cases, the API layer wires these components together within a FastAPI application while maintaining a clear separation of concerns.

- **Dependency Injection:**
  Utilizes FastAPI’s dependency injection to automatically supply configuration settings, storage clients (Minio), producer implementations (Kafka), and other dependencies.

- **Background Processing:**
  Emulation tasks run as background jobs via FastAPI’s BackgroundTasks, ensuring that the API remains responsive while handling long-running processes asynchronously.

- **Graceful Shutdown:**
  A shutdown event hook is available for cleanup tasks, ensuring that resources are properly released when the service stops.

## Installation

Install the API library along with its dependencies using your package manager (e.g., Poetry). Make sure you have configured environment variables or settings files for your external resources (e.g., Kafka, Minio).

```bash
npx nx run <project>:add --name ddd-adapters-api --local
```

## Usage

### Endpoints

#### GET `/`

Returns a welcome message to confirm that the API is running.

**Example Response:**

```json
{
  "message": "Welcome to the Emulator Service REST API!"
}
```

#### POST `/emulator`

Triggers the emulator process using the configuration provided in the request payload (conforming to the `StartEmulatorDTO` schema). This endpoint invokes the Start Emulator Use Case to set up producers, generate fake data, and schedule a background task.

**Request Payload Example:**

```json
{
  "emulator_sync": "kafka",
  "emulation_domain": "transaction",
  "timeout": 60
}
```

**Example Response:**

```json
{
  "id": "generated-uuid-string",
  "emulator_sync": "kafka",
  "emulation_domain": "transaction",
  "timeout": 60
}
```

### Configuration

The API relies on a configuration object (using a custom `Settings` class) stored on the FastAPI app state. This configuration provides connection details for Kafka, Minio, and other necessary resources.

**Example Configuration on Startup:**

```python
from emulator_settings.settings import Settings
from fastapi import FastAPI

app = FastAPI(
    title="Emulator Service REST API",
    description="API for the Emulator Service.",
    version="1.0.0"
)

app.state.config = Settings(
    kafka_bootstrap_servers="localhost:9092",
    kafka_username="your_username",
    kafka_password="your_password",
    minio_endpoint="minio.example.com",
    minio_access_key="your_access_key",
    minio_secret_key="your_secret_key",
    minio_secure=False
)
```

### Background Tasks and Graceful Shutdown

- **Background Tasks:**
  Emulation processing is executed in the background via FastAPI’s `BackgroundTasks`, ensuring that requests return promptly while the heavy processing continues asynchronously.

- **Shutdown Hooks:**
  The `@app.on_event("shutdown")` decorator registers cleanup functions to handle any necessary resource release or finalization when the service shuts down.

## Running the API

To run the API locally, you can use Uvicorn:

```bash
uvicorn main:app --reload
```

Ensure that your application (e.g., the `main.py` module) includes the API router and configuration, as shown in the usage examples above.

## Testing

Unit tests for the API controllers and use cases are provided. To run the API tests, execute:

```bash
npx nx test ddd-adapters-api
```
