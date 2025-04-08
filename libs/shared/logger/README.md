# Logger

The Logger Library provides a simple and effective way to configure logging for your Python applications. It uses JSON formatting for log messages, making it easier to integrate with log management systems and enabling structured logging.

## Features

- **JSON Formatted Logging:** Logs are output in a structured JSON format.
- **Configurable Log Levels:** Easily set the desired log level via function parameters or environment variables.
- **Modular Integration:** Quickly integrate the logger into any module by providing the module name.
- **Propagation Control:** Option to propagate log messages to parent loggers.

## Installation

```bash
npx nx run <project>:add --name shared-logger --local
```

## Usage

### Basic Setup

To set up logging with a custom module name, import the `setup_logging` function:

```python
from logger.log import setup_logging

# Create a logger for your module
logger = setup_logging(__name__)

# Log an informational message
logger.info("This is an info message.")
```

### Environment-Based Setup

You can also create a logger that automatically reads the log level from the `LOG_LEVEL` environment variable. Use the `get_logger_from_env` function as follows:

```python
from logger.log import get_logger_from_env

# Create a logger that uses the LOG_LEVEL environment variable
logger = get_logger_from_env(__name__)

# Log a debug message (if LOG_LEVEL is set to DEBUG)
logger.debug("This is a debug message.")
```

Before running your application, set the `LOG_LEVEL` environment variable if needed:

```bash
export LOG_LEVEL=DEBUG
```

## Configuration Details

- **JSON Formatter:**
  The logger uses the following format for JSON logs:

  ```
  %(levelname)s %(filename)s %(message)s
  ```

  You can modify this format directly in the code by adjusting the formatter setup if a different structure is required.

- **Propagation:**
  The `setup_logging` function accepts a `propagate` parameter. Set it to `True` if you want log messages to propagate to the parent logger.

## Testing

Unit tests are provided to ensure that the logger functions correctly. To run the tests, navigate to the `libs/shared/logger` directory and execute:

```bash
npx nx test shared-logger
```
