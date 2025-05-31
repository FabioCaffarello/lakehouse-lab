import logging
import os
import shutil


def new(debug_enabled=False, debug_storage_dir=None):
    """
    Creates a new debug.Storage object, if it is enabled.
    A useless stub is returned if the feature is off
    """
    if debug_enabled:
        logging.debug(
            "Creating debug enabled with storage at dir: " + debug_storage_dir
        )
        return EnabledDebug(debug_storage_dir)
    logging.debug("Debug disabled, creating stub")
    return DisabledDebug()


class EnabledDebug:
    def __init__(self, debug_dir):
        self._saved_responses = {}
        self._saved_captchas = {}
        self._debug_dir = debug_dir
        self._create_dir(self._get_response_dir())
        self._create_dir(self._get_captchas_dir())

    def save_response(self, filename, response_body):
        """
        Save the contents of a Scrapy Response on a file with the given filename.
        """
        filename = self._get_filename(filename, self._saved_responses)
        self._write_file(self._get_response_dir(), filename, response_body)

    def save_captcha(self, solution, image):
        """
        Save the captcha image with the given solution as its filename.
        """
        filename = self._get_filename(solution, self._saved_captchas)
        self._write_file(self._get_captchas_dir(), filename, image)

    def _get_response_dir(self):
        return self._debug_dir + "/responses/"

    def _get_captchas_dir(self):
        return self._debug_dir + "/captchas/"

    @staticmethod
    def _write_file(dirname, filename, file_to_write):
        with open(dirname + filename, "wb") as writer:
            writer.write(file_to_write)

    @staticmethod
    def _get_filename(filename, saved_files):
        if filename in saved_files:
            saved_files[filename] += 1
        else:
            saved_files[filename] = 1

        count = saved_files[filename]
        return str(count) + "-" + filename

    @staticmethod
    def _create_dir(path):
        shutil.rmtree(path, ignore_errors=True)
        os.makedirs(path)


class DisabledDebug:
    def save_response(self, filename, response):
        pass

    def save_captcha(self, image, captcha):
        pass
