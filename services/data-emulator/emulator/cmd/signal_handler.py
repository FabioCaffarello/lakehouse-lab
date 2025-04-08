import asyncio
import signal

from logger.log import get_logger_from_env

logger = get_logger_from_env(__name__)


class SignalHandler:
    def __init__(self, rest_process):
        self.rest_process = rest_process
        self.shutdown = asyncio.Event()

    async def handle_exit(self, signum, frame):
        logger.info(f"Received termination signal ({signum}), initiating shutdown...")
        self.shutdown.set()

        if self.rest_process and self.rest_process.is_alive():
            logger.info("Stopping REST API server...")
            self.rest_process.terminate()
            self.rest_process.join()

        logger.info("All services stopped. Exiting gracefully.")

    def register_signal_handler(self):
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(
                sig, lambda s=sig: asyncio.create_task(self.handle_exit(s, None))
            )
