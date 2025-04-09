import asyncio
import contextlib
import logging
import multiprocessing
import os
import sys

import uvicorn
from api.emulator_rest_api import app as rest_app
from cliargs.cli import new_args_parser
from emulator.cmd.signal_handler import SignalHandler
from emulator_settings.settings import Settings
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
        kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
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


def run_rest_server(config: Settings):
    """Run the REST API server on port 8000."""
    rest_app.state.config = config
    uvicorn.run(rest_app, host="0.0.0.0", port=8000, log_level="info")


def main():
    config, log = setup_service()
    log.info(f"Loaded configuration: {config}")

    rest_process = multiprocessing.Process(target=run_rest_server, args=(config,))
    rest_process.start()

    signal_handler = SignalHandler(rest_process)

    async def run_signal_handler():
        signal_handler.register_signal_handler()
        await signal_handler.shutdown.wait()

    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(run_signal_handler())

    rest_process.join()
    return 0


if __name__ == "__main__":
    sys.exit(main())
