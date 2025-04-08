import random
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fake_factory.base_factory import BaseFakeFactory
from faker import Faker


class DeviceLogFactory(BaseFakeFactory):
    """Factory for generating fake device log data.

    This factory creates device log records that capture various device and access
    attributes for a user. The generated record includes a unique log_id, device
    details, network information, user agent, and login/logout timestamps.
    """

    def __init__(self) -> None:
        self.faker = Faker()
        self.device_types = ["mobile", "desktop", "tablet"]
        self.operating_systems = ["Android", "iOS", "Windows", "macOS", "Linux"]

    def _generate_base_log(self) -> dict[str, Any]:
        """Generates the base device log data without additional processing.

        Returns:
            dict[str, Any]: A dictionary containing raw device log data.
        """
        # Generate a login timestamp within the last hour
        login_timestamp = datetime.now(timezone.utc) - timedelta(
            seconds=random.randint(0, 3600)
        )

        # Decide whether to generate a logout timestamp (70% chance) and
        # calculate it if needed.
        if random.random() < 0.7:
            # Ensure logout is after login (between 30 seconds and 1 hour after login)
            logout_delta = random.randint(30, 3600)
            logout_timestamp = login_timestamp + timedelta(seconds=logout_delta)
            logout_timestamp_str: Optional[str] = logout_timestamp.isoformat()
        else:
            logout_timestamp_str = None

        log = {
            "log_id": self.faker.uuid4(),
            "user_id": random.randint(1000, 9999),
            "device_id": self.faker.uuid4(),
            "device_type": random.choice(self.device_types),
            "os": random.choice(self.operating_systems),
            "ip_address": self.faker.ipv4(),
            "location": self.faker.country_code(),
            "user_agent": self.faker.user_agent(),
            "login_timestamp": login_timestamp.isoformat(),
            "logout_timestamp": logout_timestamp_str,
        }
        return log

    def generate(self) -> dict[str, Any]:
        """Generates a device log record.

        Returns:
            dict[str, Any]: The generated device log record.
        """
        return self._generate_base_log()
