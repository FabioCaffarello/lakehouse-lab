import logging

import requests
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults


class StartEmulatorOperator(BaseOperator):
    """
    Custom Airflow operator to start the emulator.
    This operator is responsible for starting the emulator and
    managing its lifecycle.
    Args:
        endpoint (str): The endpoint of the emulator.
        emulator_sync (str): The synchronization type for the emulator.
        emulation_domain (str): The domain to be emulated.
        format_type (str): The format type of the data.
        sync_type (str): The synchronization type.
        max_chunk_size (int): The maximum chunk size for data processing.
        timeout (int): The timeout for the request in seconds.
    """

    @apply_defaults
    def __init__(
        self,
        endpoint: str,
        emulator_sync: str,
        emulation_domain: str,
        format_type: str,
        sync_type: str,
        max_chunk_size: int,
        timeout: int,
        *args,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)
        self.endpoint = endpoint
        self.emulator_sync = emulator_sync
        self.emulation_domain = emulation_domain
        self.format_type = format_type
        self.sync_type = sync_type
        self.max_chunk_size = max_chunk_size
        self.timeout = timeout
        self.logger = logging.getLogger(__name__)

    def execute(self, context):
        """
        Execute the operator to start the emulator.
        This method sends a POST request to the emulator endpoint with the
        specified parameters and handles the response.
        Args:
            context: The Airflow context.
        Raises:
            ValueError: If the emulator fails to start or if the response is invalid.
        """
        payload = {
            "emulator_sync": self.emulator_sync,
            "emulation_domain": self.emulation_domain,
            "format_type": self.format_type,
            "sync_type": self.sync_type,
            "max_chunk_size": self.max_chunk_size,
            "timeout": self.timeout,
        }
        headers = {"Content-Type": "application/json"}
        self.logger.info(f"Starting emulator with payload: {payload}")

        try:
            response = requests.post(
                self.endpoint, json=payload, headers=headers, timeout=30
            )
            response.raise_for_status()

            response_data = response.json()
            if "id" not in response_data:
                self.logger.error("Response does not contain 'id' field.")
                raise ValueError("Invalid response from emulator.")
            emulation_id = response_data["id"]
            self.logger.info(f"Emulation ID: {emulation_id}")

            return emulation_id
        except requests.exceptions.HTTPError as errh:
            self.logger.error("Erro HTTP: %s", errh)
            raise
        except requests.exceptions.ConnectionError as errc:
            self.logger.error("Erro de Conexão: %s", errc)
            raise
        except requests.exceptions.Timeout as errt:
            self.logger.error("Erro de Timeout: %s", errt)
            raise
        except requests.exceptions.RequestException as err:
            self.logger.error("Erro na requisição: %s", err)
            raise
