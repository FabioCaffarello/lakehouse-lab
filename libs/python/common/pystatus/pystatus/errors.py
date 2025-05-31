from pystatus import client_error, server_error


class BaseError(Exception):
    """Base Error"""

    pass


class CrawlingError(BaseError):
    """A crawling error happened"""

    def __init__(self, status_code, status_detail=""):
        self.status_code = status_code
        self.status_detail = status_detail


class InvalidInputError(CrawlingError):
    """Indicates that the input received by the bot is invalid"""

    def __init__(self, details="no details given"):
        super().__init__(client_error.BAD_REQUEST, "Bad Request: details: " + details)


class InputNotFoundError(CrawlingError):
    """Unable to find the input on the website"""

    def __init__(self, status_detail="Not Found"):
        super().__init__(client_error.NOT_FOUND, status_detail)


class ResponsePageNotExpectedError(CrawlingError):
    """
    Indicates that the input received by the bot is valid but the page got
    was not expected
    """

    def __init__(self, status_detail="Response Page Not Expected"):
        super().__init__(server_error.RESPONSE_PAGE_NOT_EXPECTED, status_detail)


class BadGatewayError(CrawlingError):
    """Severe proxy error"""

    def __init__(self, status_detail="Bad Gateway"):
        super().__init__(server_error.BAD_GATEWAY, status_detail)


class GatewayTimeoutError(CrawlingError):
    """Connectivity between the proxy and the website (not necessarily proxy problem)"""

    def __init__(self, status_detail="Gateway Timeout"):
        super().__init__(server_error.GATEWAY_TIMEOUT, status_detail)


class NoOutputError(CrawlingError):
    """Some errors happened and bot/parser exited without produce output"""

    def __init__(self, status_detail=""):
        super().__init__(server_error.NO_OUTPUT_PRODUCED, status_detail=status_detail)


class UploadFileError(CrawlingError):
    """Throws this exception when occurs some error related to upload"""

    def __init__(self, status_detail="unable to save data"):
        super().__init__(server_error.UNABLE_TO_SAVE_FILE, status_detail)


class ServiceUnavailableError(CrawlingError):
    """Some temporary error occurred in the process flow"""

    def __init__(self, status_detail="Service Unavailable"):
        super().__init__(server_error.SERVICE_UNAVAILABLE, status_detail)


class UnableToBreakCaptchaError(CrawlingError):
    """The captcha break attempt was unsuccessful"""

    def __init__(self, status_detail="Unable to solve captcha"):
        super().__init__(
            server_error.UNABLE_TO_BREAK_CAPTCHA, status_detail=status_detail
        )


class UnableToGetFileError(CrawlingError):
    """Some error occurred in the attempt of getting the file"""

    def __init__(self, status_detail="Unable To Get File"):
        super().__init__(server_error.UNABLE_TO_GET_FILE, status_detail)


class NoOutputProducedError(CrawlingError):
    """Indicates that no output was produced during the bot execution"""

    def __init__(self, status_detail="No Output Produced"):
        super().__init__(server_error.NO_OUTPUT_PRODUCED, status_detail)


class ExceededLimitOfTryAgainError(CrawlingError):
    """Indicates that the limit of tries was exceeded"""

    def __init__(self, status_detail="Exceeded Limit Of Try Again"):
        super().__init__(server_error.EXCEEDED_LIMIT_OF_TRY_AGAIN, status_detail)


class ParserError(CrawlingError):
    """Some error occurred in the attempt of parsing data"""

    def __init__(self, status_detail="Parser Error"):
        super().__init__(server_error.PARSER_ERROR, status_detail)


class ParsingInvalidDataError(CrawlingError):
    """Indicates that data was invalid and unable to parse"""

    def __init__(self, status_detail="Parsing Invalid Data"):
        super().__init__(server_error.PARSING_INVALID_DATA, status_detail)


class SlicingError(CrawlingError):
    """Indicates that some errors occurred during slicing"""

    def __init__(self, status_detail="Slicing Error"):
        super().__init__(server_error.SLICING_ERROR, status_detail)


class StreamFailedEOSError(CrawlingError):
    """Indicates that some errors occurred during Stream"""

    def __init__(self, status_detail="Fail EOS"):
        super().__init__(server_error.STREAM_FAILED_EOS, status_detail)


class NotImplementedError(CrawlingError):
    """Indicates that something was not implemented or finished"""

    def __init__(self, status_detail="Not Implemented"):
        super().__init__(server_error.NOT_IMPLEMENTED, status_detail)


class UnathorizedError(CrawlingError):
    """Indicates that request was not authorized"""

    def __init__(self, status_detail="Unauthorized Error"):
        super().__init__(client_error.UNAUTHORIZED, status_detail)


class ForbiddenError(CrawlingError):
    """Indicates that resource requested by the bot is forbidden"""

    def __init__(self, status_detail="Forbidden Error"):
        super().__init__(client_error.FORBIDDEN, status_detail)


class BaseIdError(CrawlingError):
    """Indicates that some error occurred while creating base id"""

    def __init__(self, status_detail="Base ID Error"):
        super().__init__(server_error.BASE_ID_ERROR, status_detail)


class RequestEntityTooLargeError(CrawlingError):
    """Indicates that payload is too large"""

    def __init__(self, status_detail="Request Entity Too Large"):
        super().__init__(client_error.REQUEST_ENTITY_TOO_LARGE, status_detail)


class SourceConsistencyError(CrawlingError):
    """Indicates that some change in the source might affect data consistency. Its layout for example"""

    def __init__(self, status_detail="The source has changed"):
        super().__init__(server_error.SOURCE_CONSISTENCY_ERROR, status_detail)
