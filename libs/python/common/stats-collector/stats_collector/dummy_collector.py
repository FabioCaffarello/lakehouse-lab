from stats_collector import base


class DummyCollector(base.AbstractCollector):
    def __init__(self, botname):
        pass

    def increment_metric(self, name, tags=None):
        pass

    def set_metric(self, name, value, tags=None):
        pass

    def time_metric(self, name, time, tags=None):
        pass
