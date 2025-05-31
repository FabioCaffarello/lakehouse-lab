import os
import tempfile
import unittest
from unittest.mock import patch

from pydebug.debug import DisabledDebug, EnabledDebug, new


class TestDebugModule(unittest.TestCase):
    def test_new_returns_enabled_debug_when_true(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            dbg = new(debug_enabled=True, debug_storage_dir=tmpdir)
            self.assertIsInstance(
                dbg,
                EnabledDebug,
                "Should return an EnabledDebug instance when debug_enabled=True",
            )

    def test_new_returns_disabled_debug_when_false(self):
        dbg = new(debug_enabled=False, debug_storage_dir="/some/fake/dir")
        self.assertIsInstance(
            dbg,
            DisabledDebug,
            "Should return a DisabledDebug instance when debug_enabled=False",
        )

    def test_enabled_debug_creates_directories(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            _ = EnabledDebug(tmpdir)
            responses_dir = os.path.join(tmpdir, "responses")
            captchas_dir = os.path.join(tmpdir, "captchas")

            self.assertTrue(
                os.path.isdir(responses_dir), "Responses directory should be created"
            )
            self.assertTrue(
                os.path.isdir(captchas_dir), "Captchas directory should be created"
            )

    def test_enabled_debug_saves_response_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            dbg = EnabledDebug(tmpdir)

            sample_filename = "test_response.html"
            sample_content = b"<html>Test Response</html>"

            dbg.save_response(sample_filename, sample_content)

            expected_filename = os.path.join(
                tmpdir, "responses", "1-test_response.html"
            )
            self.assertTrue(
                os.path.exists(expected_filename), "Response file should be saved"
            )

            with open(expected_filename, "rb") as f:
                content = f.read()
            self.assertEqual(content, sample_content, "Saved file content should match")

    def test_enabled_debug_saves_captcha_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            dbg = EnabledDebug(tmpdir)

            sample_solution = "captcha_solution"
            sample_image = b"\x89PNG\r\n\x1a\nPNGDATA"

            dbg.save_captcha(sample_solution, sample_image)

            expected_filename = os.path.join(tmpdir, "captchas", "1-captcha_solution")
            self.assertTrue(
                os.path.exists(expected_filename), "Captcha file should be saved"
            )

            with open(expected_filename, "rb") as f:
                content = f.read()
            self.assertEqual(
                content, sample_image, "Saved captcha content should match"
            )

    def test_enabled_debug_multiple_saves_increments_filenames(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            dbg = EnabledDebug(tmpdir)

            filename = "same_name.file"
            content = b"data"

            dbg.save_response(filename, content)
            dbg.save_response(filename, content)

            file1 = os.path.join(tmpdir, "responses", "1-same_name.file")
            file2 = os.path.join(tmpdir, "responses", "2-same_name.file")

            self.assertTrue(
                os.path.exists(file1), "First file should be saved with prefix 1-"
            )
            self.assertTrue(
                os.path.exists(file2), "Second file should be saved with prefix 2-"
            )

    def test_disabled_debug_does_nothing(self):
        dbg = DisabledDebug()
        try:
            dbg.save_response("file", b"content")
            dbg.save_captcha("solution", b"image")
        except Exception as e:
            self.fail(
                f"DisabledDebug.save_* methods should not raise exceptions, but got: {e}"
            )

    @patch("builtins.open", side_effect=Exception("open should not be called"))
    @patch("os.makedirs", side_effect=Exception("os.makedirs should not be called"))
    @patch("shutil.rmtree", side_effect=Exception("shutil.rmtree should not be called"))
    def test_disabled_debug_file_operations_not_called(
        self, mock_rmtree, mock_makedirs, mock_open
    ):
        dbg = DisabledDebug()
        dbg.save_response("file", b"content")
        dbg.save_captcha("solution", b"image")


if __name__ == "__main__":
    unittest.main()
