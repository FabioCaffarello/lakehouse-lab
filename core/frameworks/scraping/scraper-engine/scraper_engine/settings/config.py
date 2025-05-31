from typing import Optional

from pydantic import computed_field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    log_level: str = "INFO"
    verbose: bool = False
    debug: bool = False
    crawler: str = "bot.spider.Spider"
    stats_collector: str = "statsd"
    enable_storage_pipeline: bool = False
    enable_debug_storage: bool = False
    debug_storage_dir: str = "/app/tests/debug/storage"
    enable_proxy: bool = False
    proxy_loaders: Optional[list[str]] = ["tor"]
    captcha_solvers: Optional[list[str]] = None
    download_timeout: Optional[int] = None
    botname: Optional[str] = None
    concurrency: int = 1

    spider_class: Optional[str] = None
    spider_module: Optional[str] = None

    class Config:
        env_file = ".env"

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Invalid log level: {v}. Must be one of {valid_levels}")
        return v.upper()

    def model_post_init(self, __context):
        if "." in self.crawler:
            *module_parts, class_name = self.crawler.split(".")
            self.spider_module = ".".join(module_parts)
            self.spider_class = class_name
        else:
            self.spider_module = ""
            self.spider_class = self.crawler
