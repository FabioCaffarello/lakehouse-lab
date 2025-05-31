import json
import unittest

import pyoutput.output as stream
from pystatus import client_error, info, server_error, success


class StatusPages:
    def __init__(self, index, total):
        self.index = index
        self.total = total


class TestOutput(unittest.TestCase):
    def test_output_constructor(self):
        o = stream.Output(
            status_code=123, status_detail="test detail", data={"key": "val"}
        )
        self.assertEqual(o.status_code, 123)
        self.assertEqual(o.status_detail, "test detail")
        self.assertEqual(o.data, {"key": "val"})
        self.assertEqual(o.metadata, {}, "metadata should default to {}")
        self.assertEqual(o.source_uris, {}, "source_uris should default to {}")
        self.assertIsNone(o.status_pages)
        self.assertIsNone(o.input_msg)

    def test_append_source(self):
        o = stream.Output()
        o.append_source("src1", "content1")
        o.append_source("src2", "content2")
        self.assertEqual(len(o.sources), 2)
        self.assertEqual(o.sources[0].name, "src1")
        self.assertEqual(o.sources[0].content, "content1")

    def test_set_status_code(self):
        o = stream.Output(status_code=100)
        o.set_status_code(200)
        self.assertEqual(o.status_code, 200)

    def test_set_status_detail(self):
        o = stream.Output(status_detail="original")
        o.set_status_detail("new detail")
        self.assertEqual(o.status_detail, "new detail")

    def test_set_data(self):
        o = stream.Output(data={"old": "value"})
        o.set_data({"new": "data"})
        self.assertEqual(o.data, {"new": "data"})

    def test_repr_returns_json(self):
        o = stream.Output(status_code=200, status_detail="OK", data={"a": 1})
        output_str = repr(o)  # calls o.__repr__()
        # Should be JSON string
        self.assertTrue(output_str.startswith("{") and output_str.endswith("}"))
        # Try to parse
        parsed = json.loads(output_str)
        self.assertIn("data", parsed)
        self.assertIn("status", parsed)
        self.assertEqual(parsed["status"]["code"], 200)

    def test_new_result_structure(self):
        pages = StatusPages(index=1, total=10)
        o = stream.Output(
            status_code=200,
            status_detail="OK",
            data={"msg": "hi"},
            metadata={"meta": "x"},
            source_uris={"uri": "some"},
            status_pages=pages,
        )
        result = o.new_result()
        self.assertIn("data", result)
        self.assertIn("metadata", result)
        self.assertIn("status", result)

        self.assertEqual(result["data"], {"msg": "hi"})
        self.assertEqual(result["metadata"]["meta"], "x")
        self.assertIn("sourceURIs", result["metadata"])
        self.assertEqual(result["metadata"]["sourceURIs"], {"uri": "some"})

        self.assertEqual(result["status"]["code"], 200)
        self.assertEqual(result["status"]["detail"], "OK")
        self.assertEqual(result["status"]["pages"]["index"], 1)
        self.assertEqual(result["status"]["pages"]["total"], 10)


class TestStream(unittest.TestCase):
    def setUp(self):
        self.stream = stream.Stream()

    def test_output_increments_successes_for_2xx(self):
        out = self.stream.output(status_code=200, data={"foo": "bar"})
        self.assertEqual(self.stream._successes, 1)
        self.assertEqual(self.stream._failures, 0)
        self.assertIsInstance(out, stream.Output)
        self.assertEqual(out.data, {"foo": "bar"})

    def test_output_increments_failures_for_4xx_5xx(self):
        out = self.stream.output(status_code=400)
        self.assertEqual(self.stream._failures, 1)
        self.assertEqual(self.stream._successes, 0)
        self.assertEqual(out.status_code, 400)

        out2 = self.stream.output(status_code=500)
        self.assertEqual(self.stream._failures, 2)
        self.assertEqual(self.stream._successes, 0)
        self.assertEqual(out2.status_code, 500)

    def test_ok_creates_200_output_with_detail_OK(self):
        out = self.stream.ok(data={"test": "ok"})
        self.assertEqual(out.status_code, 200)
        self.assertEqual(out.status_detail, "OK")
        self.assertEqual(out.data, {"test": "ok"})
        self.assertEqual(self.stream._successes, 1)

    def test_heartbeat(self):
        out = self.stream.heartbeat()
        self.assertEqual(out.status_code, info.HEARTBEAT)
        self.assertEqual(out.status_detail, "Heartbeat Message")

    def test_end_stream_failed_eos_when_no_successes(self):
        out = self.stream.end()
        self.assertEqual(out.status_code, server_error.STREAM_FAILED_EOS)
        self.assertIn("Stream Failed", out.status_detail)
        self.assertTrue(self.stream.eos)

    def test_end_partial_stream_when_failures(self):
        self.stream.output(status_code=200)
        self.stream.output(status_code=400)
        out = self.stream.end()
        self.assertEqual(out.status_code, success.PARTIAL_STREAM)
        self.assertIn("Partial Stream", out.status_detail)
        self.assertTrue(self.stream.eos)

    def test_end_eos_when_all_successes(self):
        self.stream.output(status_code=200)
        self.stream.output(status_code=201)
        out = self.stream.end()
        self.assertEqual(out.status_code, success.EOS)
        self.assertEqual(out.status_detail, "End Of Stream")
        self.assertTrue(self.stream.eos)

    def test_end_with_explicit_code_and_detail(self):
        out = self.stream.end(status_code=999, details="Explicit detail")
        self.assertEqual(out.status_code, 999)
        self.assertEqual(out.status_detail, "Explicit detail")

    def test_calling_stream_after_end_raises_error(self):
        self.stream.end()
        with self.assertRaises(stream.StreamError):
            self.stream.output(status_code=200)

    def test_process_success_failure_counts(self):
        o1 = stream.Output(status_code=200)
        o2 = stream.Output(status_code=500)
        self.stream.process(o1)
        self.assertEqual(self.stream._successes, 1)
        self.assertEqual(self.stream._failures, 0)
        self.stream.process(o2)
        self.assertEqual(self.stream._failures, 1)

    def test_output_merges_source_uris(self):
        self.stream.source_uris["global"] = "global_uri"
        out = self.stream.output(200, source_uris={"local": "local_uri"})
        self.assertEqual(
            out.source_uris, {"global": "global_uri", "local": "local_uri"}
        )


class TestHelpers(unittest.TestCase):
    def test_new_status(self):
        s = stream.new_status(200, "OK")
        self.assertEqual(s, {"code": 200, "detail": "OK"})

    def test_new_no_output_produced_error_status(self):
        s = stream.new_no_output_produced_error_status()
        self.assertEqual(
            s,
            {
                "code": server_error.NO_OUTPUT_PRODUCED,
                "detail": "Bot terminated without producing any kind of output",
            },
        )

    def test_new_unhandled_error_status(self):
        try:
            raise ValueError("Test Error")
        except ValueError as e:
            s = stream.new_unhandled_error_status(e)
            self.assertEqual(s["code"], server_error.UNHANDLED_ERROR)
            self.assertIn("Test Error", s["detail"])
            self.assertIn("Traceback:", s["detail"])

    def test_new_bad_request_error_status(self):
        try:
            raise Exception("Bad input")
        except Exception as e:
            s = stream.new_bad_request_error_status(e)
            self.assertEqual(s["code"], client_error.BAD_REQUEST)
            self.assertIn("Bad input", s["detail"])

    def test_new_metadata_no_processing_id(self):
        input_msg = {"_id": "1234", "foo": "bar"}
        meta = stream.new_metadata(input_msg)
        self.assertIn("input", meta)
        self.assertIn("_id", meta["input"])
        self.assertEqual(meta["input"]["_id"], "1234")
        self.assertIn("processingTimestamp", meta)
        self.assertNotIn(
            "processingId", meta, "No processingId unless provided or in input_msg"
        )

    def test_new_metadata_with_processing_id(self):
        input_msg = {"_id": "1234"}
        meta = stream.new_metadata(input_msg, processing_id="proc-777")
        self.assertIn("processingId", meta)
        self.assertEqual(meta["processingId"], "proc-777")

    def test_new_metadata_in_msg(self):
        input_msg = {"_id": "1234", "processingId": "in-msg"}
        meta = stream.new_metadata(input_msg, processing_id="ignored")
        self.assertIn("processingId", meta)
        self.assertEqual(
            meta["processingId"],
            "in-msg",
            "Should prioritize processingId from input_msg",
        )

    def test__get_error_details(self):
        try:
            raise RuntimeError("Something went wrong")
        except RuntimeError as e:
            details = stream._get_error_details(e)
            self.assertIn("Something went wrong", details)
            self.assertIn("Traceback:", details)


if __name__ == "__main__":
    unittest.main()
