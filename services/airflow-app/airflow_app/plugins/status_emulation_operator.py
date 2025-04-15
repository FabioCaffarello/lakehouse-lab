import logging
import time

import requests
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults


class StatusEmulationOperator(BaseOperator):
    """
    Custom Airflow operator to check the status of an emulator.
    This operator checks the status of an emulator by sending a GET request
    to the specified endpoint and handling the response.
    Args:
        endpoint (str): The endpoint of the emulator.
        prev_task_id (str): The task ID of the previous task to pull the emulation ID from.
        poll_interval (int): The interval in seconds to poll the status.
        max_retries (int): The maximum number of retries for status checking.
    """

    @apply_defaults
    def __init__(
        self,
        endpoint: str,
        prev_task_id: str,
        poll_interval: int = 5,
        max_retries: int = 30,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.endpoint = endpoint
        self.prev_task_id = prev_task_id
        self.poll_interval = poll_interval
        self.max_retries = max_retries
        self.logger = logging.getLogger(__name__)

    def get_emulation_status(self, emulation_id):
        """
        Check the status of the emulator using the provided emulation ID.
        Args:
            emulation_id (str): The ID of the emulation to check.
        Returns:
            dict: The status of the emulator.
        Raises:
            ValueError: If the status check fails.
        """
        emulation_id = str(emulation_id)
        url = self.endpoint.format(emulation_id)
        self.logger.info(
            f"Checking status for emulation ID: {emulation_id} at URL: {url}"
        )
        response = requests.get(url)
        if response.status_code != 200:
            self.logger.error(
                f"Failed to check status for emulation ID: {emulation_id}. HTTP Status: {response.status_code}"
            )
            raise ValueError(f"Failed to check status for emulation ID: {emulation_id}")
        return response.json()

    def execute(self, context):
        """
        Execute the operator to check the status of the emulator.
        This method retrieves the emulation ID from XCom and checks its status.
        Args:
            context: The Airflow context.
        Raises:
            ValueError: If the emulation ID is not found in XCom.
        """
        try:
            emulation_id = context["ti"].xcom_pull(task_ids=self.prev_task_id)
            if emulation_id is None:
                self.logger.error("Emulation ID not found in XCom.")
                raise ValueError("Emulation ID not found in XCom.")
            if isinstance(emulation_id, dict) and "value" in emulation_id:
                emulation_id = emulation_id["value"]
            self.logger.info(f"Starting status check for emulation ID: {emulation_id}")
            retry_count = 0

            while retry_count < self.max_retries:
                try:
                    response_data = self.get_emulation_status(emulation_id)
                except Exception as err:
                    self.logger.error(
                        f"Error checking status: {err}. Retrying in {self.poll_interval} seconds."
                    )
                    time.sleep(self.poll_interval)
                    retry_count += 1
                    continue

                status_global = response_data.get("status", {}).get("global_status")
                self.logger.info(f"Current status: {status_global}")

                if status_global == "completed":
                    self.logger.info("Emulation has finished successfully.")
                    return emulation_id

                self.logger.info(
                    f"Emulation not finished. Waiting {self.poll_interval} seconds for next check."
                )
                time.sleep(self.poll_interval)
                retry_count += 1

            raise TimeoutError(
                f"Status check for emulation ID {emulation_id} did not finish after "
                f"{self.max_retries * self.poll_interval} seconds."
            )
        except Exception as e:
            self.logger.error(f"Error during status check execution: {e}")
            raise
