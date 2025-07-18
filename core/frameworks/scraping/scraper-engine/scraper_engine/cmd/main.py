import logging
import os
import sys

from crawler_cliargs.cli import new_crawler_args_parser
from logger.log import setup_logging
from scraper_engine.base_scraper import loop, settings
from scraper_engine.settings.config import Settings
from scrapy.utils.project import get_project_settings


def set_module_level_to_error(modulename):
    log = logging.getLogger(modulename)
    log.setLevel(logging.ERROR)


def _set_log_level_env_var(log_level: str):
    """
    Set the `LOG_LEVEL` environment variable for the `logger` module.
    """
    os.environ["LOG_LEVEL"] = log_level
    return setup_logging(__name__)


def setup_service() -> tuple[None, logging.Logger]:
    """
    Parse CLI arguments, load configuration, and set up logging.
    """
    parser = new_crawler_args_parser("Run scrawler engine service.")
    args = parser.parse_args()
    config = Settings(
        log_level=args.log_level,
        verbose=args.verbose,
        debug=args.debug,
        crawler=args.crawler,
        stats_collector=args.stats_collector,
        enable_storage_pipeline=args.enable_storage_pipeline,
        enable_debug_storage=args.enable_debug_storage,
        debug_storage_dir=args.debug_storage_dir,
        enable_proxy=args.enable_proxy,
        botname=args.botname,
        concurrency=args.concurrency,
        # proxy_loaders=args.proxy_loaders,
        captcha_solvers=args.captcha_solvers,
        download_timeout=args.download_timeout,
    )
    log = _set_log_level_env_var(config.log_level)
    if config.crawler is None:
        log.error("--crawler is obligatory. run --help for more details")
        sys.exit(-1)

    if config.enable_proxy:
        if not config.proxy_loaders:
            log.error(
                "--proxy-loaders is required with proxy enabled."
                "If you don't want to use proxy set --no-proxy "
                "run --help for more details"
            )
            sys.exit(-1)
        log.info("raw proxy loaders: {}".format(config.proxy_loaders))
        # settings.PROXY_LOADERS = config.proxy_loaders.split(",")
        # log.info("parsed proxy loaders: {}".format(settings.PROXY_LOADERS))

    if config.verbose:
        log.info("Verbose mode enabled.")
    if config.debug:
        log.info("Debug mode activated.")

    # WHY: too verbose on info level
    set_module_level_to_error("pika")
    set_module_level_to_error("scrapy")
    set_module_level_to_error("twisted")

    return config, log


def setup_crawler(config: Settings):
    settings.STATS_COLLECTOR_TYPE = config.stats_collector
    settings.STORAGE_PIPELINE_ENABLED = config.enable_storage_pipeline
    settings.DEBUG_STORAGE_ENABLED = config.enable_debug_storage
    settings.DEBUG_STORAGE_DIR = config.debug_storage_dir
    settings.PROXY_LOADERS = config.proxy_loaders
    settings.CAPTCHA_SOLVERS = config.captcha_solvers
    settings.DOWNLOAD_TIMEOUT = config.download_timeout


def run_crawler(log: logging.Logger, config: Settings):
    spider_module = importlib.import_module(config.spider_module)
    SpiderClass = getattr(spider_module, config.spider_class)
    if config.botname:
        SpiderClass.name = config.botname
    settings = get_project_settings()
    settings.set("PROXY_ENABLED", config.enable_proxy)
    settings.set("STATS_COLLECTOR_TYPE", config.stats_collector)
    log.info("running loop")
    # TODO: add loop
    loop.run(SpiderClass, settings, config.concurrency)


def main():
    config, log = setup_service()

    log.info("Loaded configuring log level: {}".format(config.log_level))
    log.info(
        "configured log level to '{}' with success. Starting loop".format(
            config.log_level
        )
    )
    log.info("Loaded configuration: {}".format(config))
    setup_crawler(config)
    log.info("running crawler")
    run_crawler(config)


if __name__ == "__main__":
    main()
