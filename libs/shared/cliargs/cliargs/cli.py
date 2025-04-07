"""
Module for Creating a Standard Argument Parser

This module provides a convenience function to generate an
argparse.ArgumentParser instance with common command-line options
such as verbose output, debug mode, logging level, and version
information. It is designed to simplify the creation of consistent
CLI interfaces across multiple applications.
"""

import argparse


def new_args_parser(description: str) -> argparse.ArgumentParser:
    """Create and return an ArgumentParser with standard CLI options.

    This function initializes an argparse.ArgumentParser with the provided
    description and adds the following command-line arguments:

        --verbose:
            Enable verbose output.

        --debug:
            Activate debug mode with detailed logging.

        --log-level:
            Set the logging level. Acceptable values are "DEBUG", "INFO",
            "WARNING", "ERROR", and "CRITICAL". Defaults to "INFO".

        --version:
            Display the application's version and exit. The version is
            hardcoded as "0.1.0".

    Args:
        description (str): A brief description of the application, which is
            displayed in the help message.

    Returns:
        argparse.ArgumentParser: An ArgumentParser object configured with the
        standard command-line arguments.
    """
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output.")
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Activate debug mode with detailed logging.",
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        help="Set the logging level. Defaults to INFO.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="%(prog)s 0.1.0",
        help="Show the application's version and exit.",
    )
    return parser
