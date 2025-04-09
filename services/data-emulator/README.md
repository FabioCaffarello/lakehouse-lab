# Data Emulator Service

The Data Emulator Service orchestrates the emulation of data ingestion workflows. It provides a REST API—built on FastAPI—that enables external clients to trigger and manage emulator processes. The service integrates configuration management, logging, and resource setup (using Kafka and Minio) to simulate realistic data production. It leverages asynchronous background tasks and graceful signal handling for robust operation.

## Overview

The Data Emulator Service is designed to generate synthetic data for testing, development, and integration purposes. It consists of a primary process that:

- Parses command-line arguments using a custom CLI argument parser.
- Loads configuration settings via a custom `Settings` class.
- Sets up centralized logging.
- Spawns a child process to run the REST API server (using Uvicorn).

The service uses an asynchronous signal handler to listen for termination signals (such as SIGINT and SIGTERM), ensuring that both the REST API server and any running tasks are shutdown gracefully.

## Features

- **RESTful API Interface:**
  Provides endpoints to interact with emulator use cases, allowing external triggering of long-running data emulation tasks.

- **Modular Architecture:**
  Separates concerns by delegating configuration, logging, and resource initialization to dedicated modules. The REST API is run in an isolated child process.

- **Configuration and Dependency Injection:**
  Uses a custom `Settings` class to configure external resources (Kafka, Minio) and logging. Command-line arguments control verbosity, debug mode, and log levels.

- **Asynchronous Background Tasks:**
  Emulation tasks are scheduled asynchronously using FastAPI’s BackgroundTasks, ensuring that API responses remain quick while the heavy lifting occurs in the background.

- **Graceful Shutdown Handling:**
  A dedicated signal handler captures termination signals and coordinates the proper shutdown of the REST API process and any background tasks.

## Architecture

The service’s main entry point performs the following steps:

1. **Setup Service:**

   - Parses CLI arguments using `new_args_parser`.
   - Loads configuration settings from both CLI parameters and environment variables.
   - Sets up logging and propagates the log level to the application’s environment.

2. **Start REST API Server:**

   - Spawns a child process to run the FastAPI REST server with Uvicorn.
   - The REST API, which is built in a separate module (`api.emulator_rest_api`), receives the configuration via the app state.

3. **Signal Handling:**

   - Instantiates a `SignalHandler` that registers for termination signals.
   - Asynchronously waits for a shutdown event; upon receiving a signal, it terminates the REST API child process and cleans up resources.

4. **Shutdown:**
   - The main process joins the REST API process and exits gracefully.

## Usage

To build the current image for the Data Emulator Service, use:

```bash
npx nx image service-data-emulator
```

### Command-Line Arguments

The service supports CLI arguments (via the custom `new_args_parser`) for configuring log levels, verbosity, and debug modes. For example:

```bash
python main.py --log-level DEBUG --verbose
```

### Environment Configuration

The service reads external resource settings (e.g., Kafka, Minio) from environment variables as well as the provided CLI arguments. For instance:

- **Kafka:**
  - `KAFKA_BOOTSTRAP_SERVERS`
  - `KAFKA_USERNAME`
  - `KAFKA_PASSWORD`
- **Minio:**
  - `MINIO_ENDPOINT`
  - `MINIO_ACCESS_KEY`
  - `MINIO_SECRET_KEY`
  - `MINIO_SECURE`

These values are loaded into the custom `Settings` class and assigned to the FastAPI app state before the REST API process starts.

## Running the REST API

The REST API server is launched as a child process using Uvicorn:

```python
rest_app.state.config = config
uvicorn.run(rest_app, host="0.0.0.0", port=8000, log_level="info")
```

This isolates the API layer while enabling the main process to manage service lifecycle and signal handling.

## Signal Handling and Graceful Shutdown

The service registers signal handlers for SIGINT and SIGTERM using an asynchronous `SignalHandler`. When a termination signal is received:

- The shutdown event is triggered.
- The REST API child process is terminated and joined.
- Any background tasks are allowed to complete, and resources are released before the service exits.

## Logging

The service configures logging early in the startup sequence. It sets the `LOG_LEVEL` environment variable and uses a custom logging setup to propagate messages. Verbose and debug modes are supported via CLI arguments.

## Testing

Unit tests are provided for the various modules including CLI argument parsing, configuration loading, REST API endpoints, and signal handling. To run the tests, execute:

```bash
npx nx test services-data-emulator
```
