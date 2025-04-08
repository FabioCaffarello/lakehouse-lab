import ipaddress
import unittest
import uuid
from datetime import datetime

from fake_factory.fraud.device_factory import DeviceLogFactory


class TestDeviceLogFactory(unittest.TestCase):
    def setUp(self):
        self.factory = DeviceLogFactory()

    def test_generate_returns_dict_with_required_keys(self):
        log = self.factory.generate()
        required_keys = [
            "log_id",
            "user_id",
            "device_id",
            "device_type",
            "os",
            "ip_address",
            "location",
            "user_agent",
            "login_timestamp",
            "logout_timestamp",
        ]
        for key in required_keys:
            self.assertIn(key, log, f"Key '{key}' is missing in the generated log.")

    def test_log_id_and_device_id_are_valid_uuids(self):
        log = self.factory.generate()
        try:
            uuid.UUID(log["log_id"])
            uuid.UUID(log["device_id"])
        except Exception as e:
            self.fail("log_id or device_id is not a valid UUID. Error: " + str(e))

    def test_user_id_in_valid_range(self):
        log = self.factory.generate()
        user_id = log["user_id"]
        self.assertIsInstance(user_id, int)
        self.assertGreaterEqual(user_id, 1000)
        self.assertLessEqual(user_id, 9999)

    def test_device_type_and_os_values(self):
        log = self.factory.generate()
        valid_device_types = ["mobile", "desktop", "tablet"]
        valid_operating_systems = ["Android", "iOS", "Windows", "macOS", "Linux"]
        self.assertIn(log["device_type"], valid_device_types)
        self.assertIn(log["os"], valid_operating_systems)

    def test_login_and_logout_timestamps(self):
        log = self.factory.generate()
        login_ts = datetime.fromisoformat(log["login_timestamp"])
        logout_ts_str = log["logout_timestamp"]
        if logout_ts_str is not None:
            logout_ts = datetime.fromisoformat(logout_ts_str)
            self.assertGreater(logout_ts, login_ts)
        else:
            self.assertIsNone(logout_ts_str)

    def test_ip_address_is_valid_ipv4(self):
        log = self.factory.generate()
        ip_addr = log["ip_address"]
        try:
            ipaddress.IPv4Address(ip_addr)
        except Exception:
            self.fail("ip_address is not a valid IPv4 address.")


if __name__ == "__main__":
    unittest.main()
