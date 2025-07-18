import argparse

from cliargs.cli import new_args_parser


def new_crawler_args_parser(description: str) -> argparse.ArgumentParser:
    parser = new_args_parser(description)

    parser.add_argument(
        "--stats-collector",
        dest="stats_collector",
        default="statsd",
        help='Sets the stats collector to be used, use "none" to disable.',
    )

    parser.add_argument(
        "--enable-storage-pipeline",
        dest="enable_storage_pipeline",
        action="store_true",
        default=False,
        help="Enable or disable storage pipeline",
    )

    parser.add_argument(
        "--enable-debug-storage",
        dest="enable_debug_storage",
        action="store_true",
        default=False,
        help="Enable tortuga.debug module",
    )

    parser.add_argument(
        "--debug-storage-dir",
        dest="debug_storage_dir",
        default="/app/tests/debug/storage",
        help="Base directory for tortuga.debug module files",
    )

    parser.add_argument(
        "--concurrency",
        dest="concurrency",
        type=int,
        default=1,
        help="Sets concurrency level (number of concurrent bots).",
    )

    parser.add_argument(
        "--no-proxy",
        dest="enable_proxy",
        action="store_false",
        default=True,
        help="Disable proxy, used only for test purposes",
    )

    parser.add_argument(
        "--download-timeout",
        dest="download_timeout",
        type=int,
        help="Download timeout in seconds. Eg: 60",
    )

    parser.add_argument(
        "--proxy-loaders",
        dest="proxy_loaders",
        help="Comma-separated list of proxy loaders to use. Eg: bonanza,spy.ru",
    )

    parser.add_argument(
        "--captcha-solvers",
        dest="captcha_solvers",
        help="Comma-separated list of captcha solvers. Eg: captchacoder,anticaptcha",
    )

    parser.add_argument(
        "--botname",
        dest="botname",
        help="Override botname, useful when we have more than one queue peer source, but same bot",
    )

    parser.add_argument(
        "--crawler",
        dest="crawler",
        default="bot.spider.Spider",
        help="Crawler to be executed",
    )

    return parser
