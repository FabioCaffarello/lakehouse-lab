import statsd
from stats_collector import base


class StatsDCollector(base.AbstractCollector):
    def __init__(self, botname):
        self._client = statsd.StatsClient()
        self._botname_tag = "bot.name=" + botname

    def increment_metric(self, name, tags=None):
        self._client.incr(self.parse_statsd_metric(name, tags))

    def set_metric(self, name, value, tags=None):
        self._client.incr(
            self.parse_statsd_metric(
                name,
                tags,
            ),
            count=value,
        )

    def time_metric(self, name, time, tags=None):
        self._client.timing(self.parse_statsd_metric(name, tags), time)

    def parse_statsd_metric(self, metric_name, metric_tags=None):
        if metric_tags is None:
            metric_tags = []

        if not isinstance(metric_tags, list):
            raise TypeError("tags must be a list")

        parsed_tags = "{} ".format(self._botname_tag)
        for t in metric_tags:
            parsed_tags += t + " "
        parsed_tags = parsed_tags.strip().replace(" ", ",")

        return "{metric}#{tags}".format(metric=metric_name, tags=parsed_tags)
