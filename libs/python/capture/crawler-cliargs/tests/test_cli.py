import argparse
import unittest

from crawler_cliargs.cli import new_crawler_args_parser


class TestCliArgsParser(unittest.TestCase):
    def setUp(self):
        self.parser = new_crawler_args_parser("Test description")

    def test_description(self):
        """Ensure the parser description is set correctly."""
        self.assertEqual(self.parser.description, "Test description")

    def test_verbose_default(self):
        """Check that --verbose defaults to False."""
        args = self.parser.parse_args([])
        self.assertFalse(args.verbose)

    def test_verbose_set(self):
        """Check that --verbose is True when provided."""
        args = self.parser.parse_args(["--verbose"])
        self.assertTrue(args.verbose)

    def test_debug_default(self):
        """Check that --debug defaults to False."""
        args = self.parser.parse_args([])
        self.assertFalse(args.debug)

    def test_debug_set(self):
        """Check that --debug is True when provided."""
        args = self.parser.parse_args(["--debug"])
        self.assertTrue(args.debug)

    def test_log_level_default(self):
        """Ensure that --log-level defaults to 'INFO'."""
        args = self.parser.parse_args([])
        self.assertEqual(args.log_level, "INFO")

    def test_log_level_set(self):
        """Test that --log-level returns the specified value."""
        args = self.parser.parse_args(["--log-level", "DEBUG"])
        self.assertEqual(args.log_level, "DEBUG")

    def test_version_action_exists(self):
        """Verify that a version action is configured."""
        version_actions = [
            action
            for action in self.parser._actions
            if isinstance(action, argparse._VersionAction)
        ]
        self.assertTrue(len(version_actions) > 0, "Version action not found in parser.")

    def test_stats_collector_default(self):
        """Ensure default value for --stats-collector is 'statsd'."""
        args = self.parser.parse_args([])
        self.assertEqual(args.stats_collector, "statsd")

    def test_stats_collector_custom(self):
        """Test custom value for --stats-collector."""
        args = self.parser.parse_args(["--stats-collector", "none"])
        self.assertEqual(args.stats_collector, "none")

    def test_enable_storage_pipeline_default(self):
        """Check default is False for --enable-storage-pipeline."""
        args = self.parser.parse_args([])
        self.assertFalse(args.enable_storage_pipeline)

    def test_enable_storage_pipeline_flag(self):
        """Check that --enable-storage-pipeline sets value to True."""
        args = self.parser.parse_args(["--enable-storage-pipeline"])
        self.assertTrue(args.enable_storage_pipeline)

    def test_enable_debug_storage_default(self):
        """Check default is False for --enable-debug-storage."""
        args = self.parser.parse_args([])
        self.assertFalse(args.enable_debug_storage)

    def test_enable_debug_storage_flag(self):
        """Check that --enable-debug-storage sets value to True."""
        args = self.parser.parse_args(["--enable-debug-storage"])
        self.assertTrue(args.enable_debug_storage)

    def test_debug_storage_dir_default(self):
        """Ensure default path is set for --debug-storage-dir."""
        args = self.parser.parse_args([])
        self.assertEqual(args.debug_storage_dir, "/app/tests/debug/storage")

    def test_debug_storage_dir_custom(self):
        """Test custom path for --debug-storage-dir."""
        custom_path = "/tmp/debug"
        args = self.parser.parse_args(["--debug-storage-dir", custom_path])
        self.assertEqual(args.debug_storage_dir, custom_path)

    def test_concurrency_default(self):
        """Ensure default concurrency is 1."""
        args = self.parser.parse_args([])
        self.assertEqual(args.concurrency, 1)

    def test_concurrency_custom(self):
        """Test custom concurrency value."""
        args = self.parser.parse_args(["--concurrency", "5"])
        self.assertEqual(args.concurrency, 5)

    def test_proxy_enabled_by_default(self):
        """Check that proxy is enabled by default (not using --no-proxy)."""
        args = self.parser.parse_args([])
        self.assertTrue(args.enable_proxy)

    def test_proxy_disabled_with_flag(self):
        """Check that proxy is disabled if --no-proxy is used."""
        args = self.parser.parse_args(["--no-proxy"])
        self.assertFalse(args.enable_proxy)

    def test_download_timeout_not_set(self):
        """Ensure --download-timeout is None if not passed."""
        args = self.parser.parse_args([])
        self.assertIsNone(args.download_timeout)

    def test_download_timeout_custom(self):
        """Test custom value for --download-timeout."""
        args = self.parser.parse_args(["--download-timeout", "60"])
        self.assertEqual(args.download_timeout, 60)

    def test_proxy_loaders_not_set(self):
        """Check default value for --proxy-loaders is None."""
        args = self.parser.parse_args([])
        self.assertIsNone(args.proxy_loaders)

    def test_proxy_loaders_custom(self):
        """Test comma-separated values for --proxy-loaders."""
        value = "bonanza,spy.ru"
        args = self.parser.parse_args(["--proxy-loaders", value])
        self.assertEqual(args.proxy_loaders, value)

    def test_captcha_solvers_not_set(self):
        """Check default value for --captcha-solvers is None."""
        args = self.parser.parse_args([])
        self.assertIsNone(args.captcha_solvers)

    def test_captcha_solvers_custom(self):
        """Test comma-separated values for --captcha-solvers."""
        value = "captchacoder,anticaptcha"
        args = self.parser.parse_args(["--captcha-solvers", value])
        self.assertEqual(args.captcha_solvers, value)


if __name__ == "__main__":
    unittest.main()
