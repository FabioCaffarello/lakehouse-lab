import time
from abc import ABCMeta, abstractmethod

_RESULT_METRIC_NAMES = {
    "2": "bot.result.status.2xx.total",
    "4": "bot.result.status.4xx.total",
    "5": "bot.result.status.5xx.total",
    "6": "bot.result.status.6xx.total",
}


class AbstractCollector(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def increment_metric(self, name, tags=None):
        """increment the metric with @metric_name"""
        pass

    def start(self):
        """
        Starts the collecting, the moment this method is called will be
        used as a parameter to calculate the bot.scrap.time.milliseconds metric.
        """
        self._start = time.time()

    def finish(self):
        """
        Ends the collecting, the moment this method is called will be
        used as a parameter to calculate the bot.scrap.time.milliseconds metric.
        """
        self._end = time.time()
        self.time_metric(
            "bot.scrap.time.milliseconds", (self._end - self._start) * 1000
        )
        self._start = None
        self._end = None

    def add_result_status(self, status_code):
        """giving @status_code adds it to the result status statistics"""
        status_code_first_digit = str(status_code)[:1]
        metric_name = _RESULT_METRIC_NAMES.get(status_code_first_digit)

        if metric_name is None:
            metric_name = "bot.result.status.unknown.total"

        tag = "bot.status={}".format(status_code)

        self.increment_metric(metric_name, tags=[tag])
