import scrapy


class BaseSpider(scrapy.Spider):
    base_id_keys = None
    provider = "provider"

    def __init__(self, input_msg, debug, *args, **kwargs):
        self.logger.info(f"creating spider to crwal: {input_msg}")
        super(BaseSpider, self).__init__(*args, **kwargs)
        self.__debug = debug
        requests = self.start_craling(input_msg)
        self.__start_requests = []
        self.eos = None
        if requests is not None:
            try:
                for r in requests:
                    self.__start_requests.append(r)
            except TypeError:
                self.__start_requests.append(requests)
        self.logger.info("spider creation completed with success")

    def get_base_id(output):
        raise NotImplementedError()

    def start_craling(self, input_msg):
        raise NotImplementedError()

    def debug_response(self, response_body):
        self.__debug.save_response(filename, response_body)

    def debug_captcha(self, solution, image):
        self.__debug.save_captcha(solution, image)
