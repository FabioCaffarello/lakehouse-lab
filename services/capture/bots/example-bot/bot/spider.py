from bot import parser
from pystatus import errors
from scraper_core import base_scraper


class Spider(base_scraper.BaseSpider):

    name = "example-bot"
    provider = "example"

    def start_crawling(self, input_data):
        self.logger.info(f"received request with input: {input_data}")
        if not parser.is_valid_input(input_data):
            raise errors.InvalidInputError()
        self._input_data = input_data
        self._current_errors_attempts = 0
        return self._first_request()

    def _first_request(self):
        ...

    def _on_error(self, failure):
        ...

    @staticmethod
    def get_base_id(output):
        try:
            data = output["data"]
            return f"{data['document_id']}"
        except:
            raise errors.BaseIdError()
