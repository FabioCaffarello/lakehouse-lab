import scrapy


class BaseScraperSpider(scrapy.Spider):
    name = "base-scraper-spider"
    start_urls = ["https://www.google.com"]

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        return
