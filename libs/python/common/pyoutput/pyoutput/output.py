import base64
import json
import traceback
from datetime import datetime

from pystatus import client_error, info, server_error, success


class Output(dict):
    """
    We had to inherit from dict becouse scrapy does not allow to return
    anything but a Request, dict or Item, so that is the way to by pass.
    The link below has more info about that.
    http://doc.scrapy.org/en/latest/topics/spiders.html#topics-spiders
    """

    def __init__(
        self,
        status_code=None,
        status_detail=None,
        status_pages=None,
        data=None,
        metadata=None,
        source_uris=None,
        input_msg=None,
    ):
        self.status_code = status_code
        self.status_detail = status_detail or ""
        self.data = data or {}
        self.metadata = metadata or {}
        self.source_uris = source_uris or {}
        self.status_pages = status_pages
        self.sources = []
        self.input_msg = input_msg

    def append_source(self, name, content):
        self.sources.append(Source(name, content))

    def set_status_code(self, status_code):
        self.status_code = status_code

    def set_status_detail(self, status_detail):
        self.status_detail = status_detail

    def set_data(self, data):
        self.data = data

    def __repr__(self):
        return json.dumps(self.new_result())

    def new_result(self):
        status = self._create_output_status()
        metadata = self._create_output_metadata()
        return {"data": self.data, "metadata": metadata, "status": status}

    def _create_output_metadata(self):
        metadata = new_metadata(self.input_msg)
        metadata.update(self.metadata)
        if self.source_uris != {}:
            metadata["sourceURIs"] = self.source_uris
        return metadata

    def _create_output_status(self):
        status = {"code": self.status_code, "detail": self.status_detail}
        if self.status_pages is not None:
            status["pages"] = {
                "index": self.status_pages.index,
                "total": self.status_pages.total,
            }
        return status


class Source:
    def __init__(self, name, content):
        self.name = name
        self.content = content


class StreamError(Exception):
    pass


class Stream:
    def __init__(self):
        self.eos = False
        self._successes = 0
        self._failures = 0
        self.source_uris = {}

    def output(self, status_code, data=None, **kargs):
        """
        Creates a new output
        """
        data = data or {}
        # to not overwrite sources on streams
        source_uris = kargs.pop("source_uris", {})
        if self.source_uris:
            source_uris.update(self.source_uris)
        return self.process(
            Output(
                status_code=status_code,
                data=data,
                source_uris=source_uris.copy(),
                **kargs,
            )
        )

    def ok(self, data=None, **kargs):
        """
        Creates a new successful Output
        """
        data = data or {}
        return self.output(
            status_code=success.OK, status_detail="OK", data=data, **kargs
        )

    def end(self, status_code=None, details=None):
        """
        Creates a EOS Output. It is an error to
        call this twice. It indicates that the stream is over.

        It will automatically create a EOS output with the correct
        status code, depending on the outputs generated
        on the stream.

        The stream should not be used anymore after this
        method is called. Doing so will result on a StreamError exception.
        """
        self._check_eos()
        self.eos = True

        if not details:
            details = "No details given"

        if status_code:
            return Output(status_code=status_code, status_detail=details)

        if self._successes == 0:
            return Output(
                status_code=server_error.STREAM_FAILED_EOS,
                status_detail=f"Stream Failed: End Of Stream: successes [{self._successes}] errors [{self._failures}]",
            )
        elif self._failures > 0:
            return Output(
                status_code=success.PARTIAL_STREAM,
                status_detail=f"Partial Stream: End Of Stream: successes [{self._successes}] errors [{self._failures}]",
            )
        else:
            return Output(
                status_code=success.EOS,
                status_detail="End Of Stream",
                metadata={},
            )

    def heartbeat(self):
        """
        Creates a heartbeat Output.
        """
        self._check_eos()
        return Output(
            status_code=info.HEARTBEAT,
            status_detail="Heartbeat Message",
            metadata={},
        )

    def process(self, output):
        """
        Process the given output returning the same output.
        This method is only useful for the rare cases where you
        can't use the "output" method to create the output but
        want to process the output inside the stream state machine.

        You should probably use the "output" and "ok" methods.
        """
        self._check_eos()

        if 200 <= output.status_code < 300:
            self._successes += 1

        if output.status_code >= 400:
            self._failures += 1

        return output

    def _check_eos(self):
        if self.eos:
            raise StreamError("You can't produce data after End Of Stream")


def new_status(code, detail=None):
    status = {"code": code}
    if detail is not None:
        status["detail"] = detail
    return status


def new_no_output_produced_error_status():
    return {
        "code": server_error.NO_OUTPUT_PRODUCED,
        "detail": "Bot terminated without producing any kind of output",
    }


def new_unhandled_error_status(error):
    return {"code": server_error.UNHANDLED_ERROR, "detail": _get_error_details(error)}


def new_bad_request_error_status(error):
    return {"code": client_error.BAD_REQUEST, "detail": _get_error_details(error)}


def new_metadata(input_msg, processing_id=None):
    input_ = input_msg
    if isinstance(input_msg, dict):
        input_id = input_msg.get("_id")
        input_ = {"fields": base64.b64encode(json.dumps(input_msg).encode()).decode()}
        if input_id is not None:
            input_.update({"_id": input_id})

    metadata = {
        "input": input_,
        "processingTimestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    return _add_processing_id(metadata, input_msg, processing_id)


def _add_processing_id(metadata, input_msg, processing_id):
    processing_id_key = "processingId"
    if isinstance(input_msg, dict) and input_msg.get(processing_id_key):
        metadata[processing_id_key] = input_msg[processing_id_key]
        return metadata
    if processing_id is not None:
        metadata[processing_id_key] = processing_id
    return metadata


def _get_error_details(error):
    return "Error: " + str(error) + " Traceback: " + traceback.format_exc()
