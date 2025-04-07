import logging
import os
import sys

from cliargs.cli import new_args_parser
from emulator.internal.settings import Settings
from logger.log import setup_logging


def _set_log_level_env_var(log_level: str):
    """
    Set the `LOG_LEVEL` environment variable for the `logger` module.
    """

    os.environ["LOG_LEVEL"] = log_level


def setup_service() -> tuple[Settings, logging.Logger]:
    """
    Parse CLI arguments, load configuration, and set up logging.
    """
    parser = new_args_parser("Run agents-service.")
    args = parser.parse_args()
    config = Settings(
        log_level=args.log_level,
        verbose=args.verbose,
        debug=args.debug,
        kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
        kafka_username=os.getenv("KAFKA_USERNAME"),
        kafka_password=os.getenv("KAFKA_PASSWORD"),
    )

    log = setup_logging(__name__, log_level=args.log_level)
    _set_log_level_env_var(config.log_level)
    if args.verbose:
        log.info("Verbose mode enabled.")
    if args.debug:
        log.info("Debug mode activated.")

    return config, log


def main():
    config, log = setup_service()
    log.info(f"Loaded configuration: {config}")


if __name__ == "__main__":
    sys.exit(main())
