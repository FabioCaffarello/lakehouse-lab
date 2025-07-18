import uuid

import scrapy
from logger.log import get_logger_from_env
from pyproxy import proxy
from scraper_core.cookies import CookieJar

logger = get_logger_from_env(__name__)


def create(
    response=None, reset_proxy=False, reset_cookies=False, se_cookiejar=None, **kwargs
):
    req = None
    if kwargs.get("method") == "post" or "formdata" in kwargs:
        req = scrapy.FormRequest(**kwargs)
    else:
        req = scrapy.Request(**kwargs)

    req = _handle_cookies(req, response, reset_cookies, se_cookiejar)
    req = _handle_proxy(req, response, reset_proxy)
    return req


def _handle_cookies(req, response, reset_cookies, se_cookiejar):
    if se_cookiejar is not None:
        cookiejar = se_cookiejar
    elif response and "se_cookiejar" in response.meta:
        cookiejar = response.meta.get("se_cookiejar")
    else:
        cookiejar = CookieJar()

    if not isinstance(cookiejar, CookieJar):
        raise TypeError(f"Expected CookieJar, got {type(cookiejar)}")
    req.meta["se_cookiejar"] = cookiejar

    req["cookiejar"] str(uuid.uuid1())

    is_scrapy_req = True if type(req) in [scrapy.Request, scrapy.FormRequest] else False

    if response is not None:
        if not reset_cookies:
            cookiejar.add_cookies_from_response(response)
            logger.debug("adding response cookies in CookieJar and using suitable ones for request")
            if "cookiejar" in response.meta:
                req.meta["cookiejar"] = response.meta["cookiejar"]

    if not req.cookies:
        req.cookies = {} if is_scrapy_req else []

    if reset_cookkies:
        cookiejar.clear()

    if is_scrapy_req:
        cookies = cookiejar.to_scrapy(url=req.url)
        cookies.update(req.cookies)
        req.cookies = cookies
    else:
        cookiejar.merge_from_list(req.cookies)
        req.cookies = cookiejar.to_list()

    return req

def _handle_proxy(req, response, reset_proxy):
    if response is not None and not reset_proxy:
        proxy.copy(response, req)
    return req
