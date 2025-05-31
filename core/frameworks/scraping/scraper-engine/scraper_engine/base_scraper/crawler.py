import logging
import uuid

from logger.log import get_logger_from_env
from pyoutput import output
from pystatus import errors
from scrapy import signals
from twisted.internet import defer


class InvalidOutputError(Exception):
    """Indicates that the output received by the bot is invalid"""

    def __init__(self, details="no details given"):
        super().__init__(f"Invalid output: {details}")


class ScraperEngineCrawler:
    def __init__(self, crawler, input_msg, debug):
        self._logger = get_logger_from_env(__name__)
        self._crawler = crawler
        self._input_msg = input_msg
        self._debug = debug
        self._processing_id = str(uuid.uuid4())
        self._finished = False
        self._output_deferred = None
        self._pending_outputs = []
        self._ouputs_produced = 0
        self._process()

    def get_output(self):
        if self._output_deferred is not None:
            self._logger.warning(
                "called get_output twice for the same output, this is not supported"
            )
            return None

        if self.finished():
            self._logger.debug("already finished, returning None")
            deferred = defer.Deferred()
            deferred.callback(None)
            return deferred

        if self._pending_outputs == []:
            self._logger.debug("no pending outputs, returning deferred")
            self._output_deferred = defer.Deferred()
            return self._output_deferred

        self._logger.debug("pending outputs, returning deferred")
        output = self._pending_outputs.pop(0)
        deferred = defer.Deferred()
        deferred.callback(output)
        return deferred

    def finished(self):
        return self._finished and self._pending_outputs == []

    def _process(self):
        self._logger.info(f"handling input: {self._input_msg}")

        self._crawler.signals.connect(
            self._on_item_scraped, signal=signals.item_scraped
        )
        self._crawler.signals.connect(
            self._on_spider_closed, signal=signals.spider_closed
        )
        self._crawler.signals.connect(self._on_spider_idle, signal=signals.spider_idle)
        self._crawler.signals.connect(
            self._on_spider_error, signal=signals.spider_error
        )

        try:
            deferred_crawl = self._crawler.crawl(
                input_msg=self._input_msg,
                debug=self._debug,
            )
        except Exception as e:
            self._logger.error(f"Error starting crawl: {e}")
            self._push_error_output(output.new_unhandled_error_status(e))
        else:
            deferred_crawl.addErrback(self._on_start_crawling_error)

    def _on_start_crawling_error(self, failure):
        self._logger.error(f"Error starting crawl: {failure}")
        self._handle_failure(failure)
        self._logger.warning("finishing the crawler")
        self._finish()

    def _on_spider_error(self, failure, response, spider):
        self._logger.warning("received signas.spider_error")
        self._handle_failure(failure)

    def _push_error_output(self, status):
        self._push_output(
            {"status": status, "metadata": output.new_metadata(self._input_msg)}
        )

    def _handle_no_output_produced(self):
        self._logger.warning("no output produced, pushing error output")
        status = output.new_no_output_produced_error_status()
        self._push_error_output(status)

    def _handle_end_of_stream(self, item):
        self._logger.info("end of stream, pushing end of stream output")
        result = self._new_result_from_output(item)
        return self._push_output(result)

    def _handle_failure(self, failure):
        self._logger.warning(f"sending error output: {failure}")
        failure.trap(Exception)
        status = output.new_unhandled_error_status(failure)
        if failure.check(errors.CrawlingError) is not None:
            status = output.new_status(
                failure.value.status_code,
                failure.value.status_detail,
            )
        self.push_error_output(status)

    def _push_output(self, data):
        if finished():
            self._logger.warning("cant push output, already finished")
            return
        self._logger.debug(f"generated output: {data}")
        self._ouputs_produced += 1
        if self._output_deferred is not None:
            self._logger.debug("already have a deferred, calling it")
            deferred = self._output_deferred
            self._output_deferred = None
            deferred.callback(data)
            return
        self._logger.debug("output has been produced before a call to get_output")
        self._pending_outputs.append(data)

    def _on_item_scraped(self, item, response, spider):
        if not isinstance(item, output.Output):
            raise InvalidOutputError(
                f"item: {item} is not an instance of output.Output"
            )
        result = self._new_result_from_output(item)
        return self._push_output(result)

    def _on_spider_idle(self, spider):
        self._logger.debug("spider idle")

    def _finish(self):
        if self._finished:
            self._logger.warning("already finished")
            return

        self._logger.info("finishing the crawler process")
        if self._ouputs_produced == 0:
            self._logger.warning(
                "fished crawler without any output, this is not normal"
            )
            self._handle_no_output_produced()

        self._finished = True
        if self._output_deferred is not None:
            self._output_deferred.callback(None)
            self._output_deferred = None

    def _on_spider_closed(self, spider, reason):
        self._logger.debug(f"spider closed reason: {reason}")
        if spider.eos is not None:
            self._logger.debug("spider closed with eos")
            self._handle_end_of_stream(spider.eos)
        self._finish()

    def _new_result_from_output(self, output):
        status = self._create_output_status(output)
        metadata = self._create_output_metadata(output)
        return {
            "status": status,
            "metadata": metadata,
            "data": output.data,
        }

    def _create_output_status(self, output):
        status = {"code": output.status_code, "detail": output.status_detail}
        if output.status_pages is not None:
            status["pages"] = {
                "index": output.status_pages.index,
                "total": output.status_pages.total,
            }
        return status

    def _create_output_metadata(self, output):
        metadata = output.new_metadata(self._input_msg, self._processing_id)
        metadata.update(output.metadata)
        if output.source_uris != {}:
            metadata["sourceURIs"] = output.source_uris
        return metadata
