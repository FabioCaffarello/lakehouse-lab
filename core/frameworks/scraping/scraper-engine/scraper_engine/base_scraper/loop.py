import json
import logging

from logger.log import get_logger_from_env
from pydebug import debug
from pyoutput import output
from pystatus import client_error, server_error, success
from rmq_queue import queue
from scraper_engine.base_scraper.crawler import ScraperEngineCrawler
from scrapy.crawler import CrawlerRunner
from stats_collector import factory
from twisted.internet import defer, reactor

logger = get_logger_from_env(__name__)


def run(spider_class, settings, concurrency):
    reactor.callWhenRunning(_start_loops(spider_class, settings, concurrency))
    reactor.run()
    logger.warning("Reactor stopped. Exiting...")


def _start_loops(spider_class, settings, concurrency):
    concurrency = int(concurrency)

    def start():
        logger.info(f"running {concurrency} loops")
        logger.info("creating queues")

        runner = CrawlerRunner(settings)
        try:
            connection = queue.connect()
            input_queue_name, output_queue_name = queue.get_queues_names(
                spider_class.name, spider_class.provider
            )
            input_queue = queue.Queue(connection, input_queue_name)
            output_queue = queue.Queue(connection, output_queue_name)
            reactor.callWhenRunning(_new_heartbeat_sender(connection))
        except Exception as e:
            logger.error(f"fatal error connecting to queues: {e}")
            logger.error("exiting")
            reactor.crash(logger)

        logger.info("created queues successfully")
        for i in range(concurrency):
            logger.info(f"running loop {i}")
            loop = Loop(
                logger,
                input_queue,
                output_queue,
                runner,
                spider_class,
                settings,
            )
            reactor.callWhenRunning(loop.run)

    return start


class Loop:
    def __init__(
        self,
        logger,
        input_queue,
        output_queue,
        runner,
        spider_class,
        settings,
    ):
        self.logger = logger
        self._input_queue = input_queue
        self._output_queue = output_queue
        self._runner = runner
        self._spider_class = spider_class
        self._settings = settings
        self._stats_collector_type = settings.get("STATS_COLLECTOR_TYPE")
        self._dbg = debug.new(
            settings.get("DEBUG_STORAGE_ENABLED"), settings.get("DEBUG_STORAGE_DIR")
        )

    @defer.inlineCallbacks
    def run(self):
        try:
            self.logger.info("starting loop")
            while True:
                yield self._process_input()
        except Exception as e:
            self.logger.error(f"fatal error in loop: {e}")
            _crash(self.logger)

    @defer.inlineCallbacks
    def _process_input(self):
        self.logger.info("pop next input")
        wait_input = 1.0
        self._has_partial_error = False
        self._has_output_success = False
        input_msg = None
        while input_msg is None:
            try:
                input_msg = self._input_queue.pop()
            except Exception as e:
                self.logger.error(f"error popping input: {e}")
                yield _sleep(wait_input)
                continue

            if input_msg is None:
                self.logger.info("no input available")
                yield _sleep(wait_input)

        stats_collector = factory.new_collector(
            self._spider_class.name,
            self._stats_collector_type,
        )
        stats_collector.start()
        try:
            self.logger.info("parsing input as JSON")
            input_text = input_msg.decode("utf-8")
            input_json = json.loads(input_text)
        except ValueError as e:
            self.logger.error(f"error parsing input as JSON: {e}")
            error_output = {
                "status": output.new_bad_request_error_status(e),
                "metadata": output.new_metadata(input_text),
            }
            self.logger.warning(f"producing error output: {error_output}")
            self._push_output(error_output)
        else:
            self.logger.debug("parsed input with success, running crawler")
            crawler = self._runner.create_crawler(self._spider_class)
            yield self._run_crawler(
                ScraperEngineCrawler(crawler, input_json, self._dbg), stats_collector
            )
        finally:
            self.logger.debug("sending metrics for this crawler")
            stats_collector.finish()
            self.logger.debug("finished sending metrics for this crawler")

    @defer.inlineCallbacks
    def _run_crawler(self, scraper_crawler, stats_collector):
        while not scraper_crawler.fineshed():
            self.logger.info("getting next output")
            output = yield scraper_crawler.get_output()
            if output is None:
                self.logger.info("crawler finished")
                return

            self.logger.info(f"produced output: {output}")

            pushed_output = False
            try_again_sec = 1
            while not pushed_output:
                try:
                    self._push_output(output)
                    pushed_output = True
                except CreateOutputException as e:
                    self.logger.error(f"create output error on push output: {e}")
                    self._has_partial_error = True
                    self._push_output_on_exception(output, e.message, e.status_code)
                    pushed_output = True
                except NotImplementedError as e:
                    self.logger.error(
                        f"error pushing output: get_base_id not implemented on spider / {e}"
                    )
                    _crash(self.logger)
                    return
                except GetBaseIdException as e:
                    self.logger.error(e)
                    _crash(self.logger)
                    return
                except Exception as e:
                    self.logger.error(f"exception pushing output: {e}")
                    yield _sleep(try_again_sec)

            stats_collector.add_result_status(output["status"]["code"])
            if output["status"]["code"] == client_error.UNAUTHORIZED:
                stats_collector.increment_metric(
                    "bot.result.status.detail",
                    [f"bot.status.detail={output['status']['detail']}"],
                )
            bandwidth_in = self._get_bandwidth(scraper_crawler, "in")
            self._send_metric_bandwidth(stats_collector, "in", bandwidth_in)
            bandwidth_out = self._get_bandwidth(scraper_crawler, "out")
            self._send_metric_bandwidth(stats_collector, "out", bandwidth_out)
            self.logger.info("pushed output")

    def _push_output(self, output):
        status_code = output["status"]["code"]
        if status_code == success.EOS and self._has_partial_error:
            output["status"]["code"] = success.PARTIAL_STREAM
            output["status"]["detail"] = "Partial Stream set by scraper engine"
        if status_code == success.EOS and not self._has_output_success:
            output["status"]["code"] = server_error.STREAM_FAILED_EOS
            output["status"]["detail"] = "Stream Failed set by scraper engine"

        base_id = self._get_base_id(output)
        self.logger.info(f"using this base id: {base_id}")
        ...

    def _push_output_on_exception(self, output, detail, status_code):
        if status_code == client_error.BAD_REQUEST:
            status_code = server_error.PARSING_INVALID_DATA
        output["status"]["code"] = status_code
        output["status"]["detail"] = detail
        _push_output(output)

    def _send_metric_bandwidth(self, stats_collector, type_bw, value):
        stats_collector.set_metric(
            f"bot.bandwidth.{type_bw}.bytes",
            int(value),
            [f"bot.bandwidth={type_bw}"],
        )

    def _get_bandwidth(self, scraper_crawler, type_bw):
        try:
            if type_bw == "in":
                return scraper_crawler._crawler.stats._stats.get(
                    "downloader/response_bytes"
                )
            elif type_bw == "out":
                return scraper_crawler._crawler.stats._stats.get(
                    "downloader/request_bytes"
                )
        except Exception as e:
            self.logger.error(f"error getting bandwidth: {e}")
        return 0

    def _get_base_id(self, output):
        try:
            if _is_not_output_status_ok(output["status"]["code"]):
                self.logger.info("using base id from input")
                return _base_id_from_input_and_status_code(output)
            self.logger.info("using base id from spider")
            return str(self._spider_class.get_base_id(output))
        except Exception as e:
            raise GetBaseIdException(f"unable to get base id from spider / error: {e}")


class GetBaseIdException(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.message = message


def _is_not_output_status_ok(status_code):
    return status_code != success.OK


def _base_id_from_input_and_status_code(output):
    input_ = output["metadata"]["input"]
    status_code = output["status"]["code"]
    return f"{input_}{status_code}"


def _new_heartbeat_sender(connection):
    heartbeat_interval_sec = 15.0

    @defer.inlineCallbacks
    def heartbeat_sender():
        try:
            yield _sleep(heartbeat_interval_sec)
            logger.info("sending heartbeat")
            connection.heartbeat()
            logger.info("heartbeat sent")
        except Exception as e:
            logger.error(f"error sending heartbeat: {e}")
            try:
                logger.info("attempting to reconnect")
                connection.reconnect()
                logger.info("reconnected successfully")
            except Exception as e:
                logger.error(f"error reconnecting: {e}")
                _crash()

    return heartbeat_sender


def _sleep(seconds):
    d = defer.Deferred()
    reactor.callLater(seconds, d.callback, None)
    return d


def _crash(logger: logging.Logger):
    logger.error("crashing reactor")
    reactor.crash()
    logger.error("reactor crashed")
