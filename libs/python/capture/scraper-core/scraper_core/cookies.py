import json
from dataclasses import MISSING, dataclass, field, fields
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from dateutil import parser as date_parser
from logger.log import get_logger_from_env

logger = get_logger_from_env(__name__)


@dataclass
class Cookie:
    name: str
    value: str
    domain: str
    path: str = "/"
    http_only: bool = False
    secure: bool = True
    expires: str | None = None
    creation_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self):
        for _field in fields(self):
            if getattr(self, _field.name) is None:
                if _field.default is not MISSING:
                    setattr(self, _field.name, _field.default)
                elif _field.default_factory is not MISSING:
                    setattr(self, _field.name, _field.default_factory())

    @classmethod
    def parse_set_cookies(cls, cookie_str: str, url_based_domain: str = None):
        parts = cookie_str.split(";")
        key_value = parts[0].split("=", 1)
        name, value = key_value

        attributes = {
            part.split("=")[0].strip().lower(): "=".join(part.split("=")[1:]).strip()
            for part in parts[1:]
        }

        return cls(
            name=name.strip(),
            value=value.strip(),
            domain=attributes.get("domain", url_based_domain),
            path=attributes.get("path", "/"),
            http_only="httponly" in attributes,
            secure="secure" in attributes,
            expires=attributes.get("expires"),
        )

    @classmethod
    def parse_date(cls, expires):
        try:
            expires_parsed = date_parser.parse(expires)
            return expires_parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None

    def is_expired(self, offset_seconds: int = 0):
        current_time = datetime.now(timezone.utc)

        if self.expires:
            expires_parsed = self.parse_date(self.expires)
            if expires_parsed < current_time or (
                expires_parsed - current_time
            ) <= timedelta(seconds=offset_seconds):
                return True
        return False

    def matches_domain(self, request_path: str):
        return request_path.startswith(self.path)

    def to_scrapy(self):
        return {self.name: self.value}

    def to_dict(self):
        return {
            "name": self.name,
            "value": self.value,
            "domain": self.domain,
            "path": self.path,
            "httpOnly": self.http_only,
            "secure": self.secure,
            "expires": self.expires,
            "creation_time": self.creation_time.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict):
        try:
            return cls(
                name=data["name"],
                value=data["value"],
                domain=data["domain"],
                path=data.get("path", "/"),
                http_only=data.get("httpOnly", False),
                secure=data.get("secure", True),
                expires=data.get("expires"),
                creation_time=cls.parse_date(data.get("creation_time")),
            )
        except Exception:
            return

    def __eq__(self, value: object) -> bool:
        if not isinstance(value, Cookie):
            return False
        return (
            self.name == value.name
            and self.value == value.value
            and self.domain == value.domain
            and self.path == value.path
            and self.http_only == value.http_only
            and self.secure == value.secure
            and self.expires == value.expires
        )

    def __repr__(self):
        return f"{self.to_dict()}"


class CookieJar(list):
    def __init__(self, cookies: list[Cookie] = None):
        cookies = cookies or []
        for cookie in cookies:
            if not isinstance(cookie, Cookie):
                raise TypeError(f"Expected Cookie, got {type(cookie)}")
        super().__init__(cookies)

    def append(self, item):
        if not isinstance(item, Cookie):
            raise TypeError(f"Expected Cookie, got {type(item)}")
        super().append(item)

    def add_cookie(self, new_cookie: Cookie, overwrite: bool = False):
        for i, cookie in enumerate(self):
            if cookie == new_cookie:
                if overwrite:
                    self[i] = new_cookie
                return
            if cookie.name == new_cookie.name and cookie.matches_domain(
                new_cookie.domain
            ):
                self[i] = new_cookie
                return
        self.append(new_cookie)

    def add_cookie_from_scrapy_request_cookies(self, new_cookie: Cookie):
        for cookie in self:
            if cookie.name == new_cookie.name and cookie.matches_domain(
                new_cookie.domain
            ):
                return
        self.append(new_cookie)

    def get_url_based_domain(sel, url: str) -> str:
        return urlparse(url).netloc

    def add_cookies_from_response(self, response):
        url_based_domain = self.get_url_based_domain(response.url)
        if hasattr(response, "data"):
            if "cookies" not in response.data:
                logger.warning("No cookies found in response data")
                return
            for cookie_info in response.data.get("cookies", []):
                cookie = Cookie(
                    name=cookie_info["name"],
                    value=cookie_info["value"],
                    domain=cookie_info["domain"],
                    path=cookie_info.get("path", "/"),
                    http_only=cookie_info.get("httpOnly", True),
                    secure=cookie_info.get("secure", True),
                    expires=cookie_info.get("expires"),
                )
                self.add_cookie(cookie)
        else:
            if (
                hasattr(response, "request")
                and hasattr(response.request, "cookies")
                and isinstance(response.request.cookies, dict)
            ):
                req_url_based_domain = self.get_url_based_domain(response.request.url)
                for name, value in response.request.cookies.items():
                    self.add_cookie_from_scrapy_request_cookies(
                        Cookie(
                            name=name,
                            value=value,
                            domain=req_url_based_domain,
                        )
                    )
            cookies = response.headers.getlist("Set-Cookie")
            for cookie_str in cookies:
                try:
                    cookie = Cookie.parse_set_cookies(
                        cookie_str.decode("utf-8"), url_based_domain
                    )
                    self.add_cookie(cookie, overwrite=True)
                except ValueError as e:
                    logger.warning(f"Failed to parse cookie: {e}")
                    continue

    def _get_cookies_for_request(self, url: str = None):
        if not url:
            return self
        parsed_url = urlparse(url)
        request_domain = parsed_url.netloc
        request_path = parsed_url.path
        if not request_path:
            request_path = "/"
        suitable_cookies = []

        for cookie in self:
            if cookie.matches_domain(request_domain) and cookie.matches_path(
                request_path
            ):
                suitable_cookies.append(cookie)

        return suitable_cookies

    def to_scrapy(self, url: str) -> dict[str, str]:
        cookies_dict = {}
        for cookie in self._get_cookies_for_request(url):
            cookies_dict.update(cookie.to_scrapy())
        return cookies_dict

    def any_expired(self, url: str | None = None, offset_seconds: int = 0) -> bool:
        cookies = self
        if url:
            cookies = self._get_cookies_for_request(url)
            if not cookies:
                return True
        return any(cookie.is_expired(offset_seconds) for cookie in cookies)

    def session_expired(self, session_limit: int, url: str) -> bool:
        cookies = self
        if url:
            cookies = self._get_cookies_for_request(url)
            if not cookies:
                return True
        delta = timedelta(seconds=session_limit)
        for cookie in cookies:
            elapsed_time = datetime.now(tz=timezone.utc) - cookie.creation_time
            if elapsed_time > delta:
                return True
        return False

    def to_list(self):
        return [cookie.to_dict() for cookie in self]

    def from_list(self, cookies_list: list[dict]):
        try:
            self.clear()
            for data in cookies_list:
                cookie = Cookie.from_dict(data)
                if cookie:
                    self.append(cookie)
        except Exception:
            return

    def merge_from_list(self, cookies_list: list[dict]):
        try:
            for data in cookies_list:
                cookie = Cookie.from_dict(data)
                if cookie:
                    self.add_cookie(cookie, overwrite=True)
        except Exception:
            return

    def from_json(self, json_data):
        try:
            self.from_list(json.loads(json_data))
        except Exception:
            return

    def to_json(self):
        try:
            return json.dumps(self.to_list(), indent=4)
        except Exception:
            return

    def save_to_file(self, file_path: str):
        with open(file_path, "w") as file:
            file.write(self.to_json())

    def load_from_file(self, file_path: str):
        try:
            with open(file_path, "r") as file:
                self.from_json(file.read())
        except FileNotFoundError:
            return
