import os
import unittest

from pysd import service_discovery


class ServiceDiscoveryGatewayTests(unittest.TestCase):

    def test_should_get_gateway_host(self):
        GATEWAY_HOST = "oloko"
        os.environ["GATEWAY_HOST"] = GATEWAY_HOST
        host = service_discovery.get_gateway_host()
        self.assertEqual(host, GATEWAY_HOST)
        del os.environ["GATEWAY_HOST"]

    def test_should_raise_error_without_env(self):
        with self.assertRaises(EnvironmentError):
            service_discovery.get_gateway_host()


if __name__ == "__main__":
    unittest.main(buffer=True)
