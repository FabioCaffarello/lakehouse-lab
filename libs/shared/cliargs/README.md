# CLI Arguments Parser

The CLI Arguments Parser Library provides a convenience function to generate a standard `argparse.ArgumentParser` with common command-line options such as verbose output, debug mode, logging level, and version information. It is designed to simplify the creation of consistent CLI interfaces across multiple applications.

## Features

- **Standard CLI Options:** Pre-configured with commonly used command-line options.
- **Consistent Interface:** Ensures a uniform command-line interface for your applications.
- **Ease of Integration:** Quickly integrate the parser into any project with minimal configuration.

## Installation

```bash
npx nx run <project>:add --name shared-cliargs --local
```

## Usage

### Basic Setup

To create a standard argument parser for your application, import the `new_args_parser` function:

```python
from cliargs.cliargs import new_args_parser

# Create the argument parser with a brief description of your application
parser = new_args_parser("Description of your application")
args = parser.parse_args()

if args.verbose:
    print("Verbose mode enabled")
```

### Standard CLI Options

The parser includes the following command-line options:

- `--verbose`: Enable verbose output.
- `--debug`: Activate debug mode with detailed logging.
- `--log-level`: Set the logging level. Acceptable values are "DEBUG", "INFO", "WARNING", "ERROR", and "CRITICAL". Defaults to "INFO".
- `--version`: Display the application's version and exit.

## Configuration Details

The `new_args_parser` function initializes an `argparse.ArgumentParser` with the provided description and adds the standard CLI options listed above. You can easily extend the parser with additional arguments as required by your application.

## Testing

Unit tests are provided to ensure the argument parser functions correctly. To run the tests, navigate to the `libs/shared/cliargs` directory and execute:

```bash
npx nx test shared-cliargs
```
