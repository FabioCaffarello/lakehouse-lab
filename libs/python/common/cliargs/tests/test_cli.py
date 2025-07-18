import argparse
import unittest

from cliargs.cli import new_args_parser


class TestCliArgsParser(unittest.TestCase):
    def setUp(self):
        self.parser = new_args_parser("Test description")

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


if __name__ == "__main__":
    unittest.main()
