"""Logging module."""

import logging
import os

from pythonjsonlogger import json


def setup_logging(
    module_name: str,
    propagate: bool = False,
    log_level: str = os.getenv("LOG_LEVEL", "INFO").upper(),
) -> logging.Logger:
    """
    Set up logging using JSON format.

    Args:
        module_name (str): The module name.
        propagate (bool): Whether to propagate the logging to the parent logger.
        log_level (str): The log level.

    Returns:
        The logger.
    """
    log_handler = logging.StreamHandler()
    formatter = json.JsonFormatter("%(levelname)s %(filename)s %(message)s")
    log_handler.setFormatter(formatter)

    logger = logging.getLogger(module_name)
    logger.addHandler(log_handler)
    logger.propagate = propagate
    logger.setLevel(logging.getLevelName(log_level))
    return logger


def get_logger_from_env(module_name: str) -> logging.Logger:
    """
    Get a logger using the `LOG_LEVEL` environment variable.

    Args:
        module_name (str): The module name.

    Returns:
        The logger.
    """
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    return setup_logging(module_name, log_level=log_level)
