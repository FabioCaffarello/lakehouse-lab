import unittest
from io import BytesIO
from unittest.mock import MagicMock

from minio.error import S3Error
from storage.minio.storage import MinioStorageClient


class DummyBucket:
    def __init__(self, name):
        self.name = name


class DummyObject:
    def __init__(self, object_name):
        self.object_name = object_name


class DummyResponse:
    def __init__(self, data: bytes):
        self.data = data

    def read(self):
        return self.data


class TestMinioStorageClient(unittest.TestCase):
    def setUp(self):
        self.endpoint = "minio.example.com"
        self.access_key = "dummy_access"
        self.secret_key = "dummy_secret"
        self.client = MinioStorageClient(
            endpoint=self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=False,
        )
        self.client.client = MagicMock()

    def test_create_bucket_success(self):
        bucket_name = "test_bucket"
        self.client.client.make_bucket.return_value = None
        self.client.create_bucket(bucket_name)
        self.client.client.make_bucket.assert_called_with(bucket_name)

    def test_create_bucket_failure(self):
        bucket_name = "test_bucket"
        error = S3Error(
            "Error", "Error", 500, "dummy_request_id", "dummy_host_id", "dummy_response"
        )
        self.client.client.make_bucket.side_effect = error
        with self.assertRaises(S3Error):
            self.client.create_bucket(bucket_name)

    def test_list_buckets_success(self):
        dummy_buckets = [DummyBucket("bucket1"), DummyBucket("bucket2")]
        self.client.client.list_buckets.return_value = dummy_buckets
        buckets = self.client.list_buckets()
        self.assertEqual(buckets, ["bucket1", "bucket2"])

    def test_list_buckets_failure(self):
        error = S3Error(
            "Error", "Error", 500, "dummy_request_id", "dummy_host_id", "dummy_response"
        )
        self.client.client.list_buckets.side_effect = error
        with self.assertRaises(S3Error):
            self.client.list_buckets()

    def test_upload_file_success(self):
        bucket_name = "test_bucket"
        object_name = "file.txt"
        file_path = "/path/to/file.txt"
        self.client.client.fput_object.return_value = None
        expected_uri = f"http://{self.endpoint}/{bucket_name}/{object_name}"
        uri = self.client.upload_file(bucket_name, object_name, file_path)
        self.client.client.fput_object.assert_called_with(
            bucket_name, object_name, file_path
        )
        self.assertEqual(uri, expected_uri)

    def test_upload_file_failure(self):
        bucket_name = "test_bucket"
        object_name = "file.txt"
        file_path = "/path/to/file.txt"
        error = S3Error(
            "Error", "Error", 500, "dummy_request_id", "dummy_host_id", "dummy_response"
        )
        self.client.client.fput_object.side_effect = error
        with self.assertRaises(S3Error):
            self.client.upload_file(bucket_name, object_name, file_path)

    def test_upload_bytes_success_with_bytes(self):
        bucket_name = "test_bucket"
        object_name = "bytes.txt"
        bytes_data = b"test data"
        self.client.client.put_object.return_value = None
        expected_uri = f"http://{self.endpoint}/{bucket_name}/{object_name}"
        uri = self.client.upload_bytes(bucket_name, object_name, bytes_data)
        self.assertEqual(uri, expected_uri)

    def test_upload_bytes_success_with_bytesio(self):
        bucket_name = "test_bucket"
        object_name = "bytesio.txt"
        bytes_data = BytesIO(b"test data")
        self.client.client.put_object.return_value = None
        expected_uri = f"http://{self.endpoint}/{bucket_name}/{object_name}"
        uri = self.client.upload_bytes(bucket_name, object_name, bytes_data)
        self.assertEqual(uri, expected_uri)

    def test_upload_bytes_failure(self):
        bucket_name = "test_bucket"
        object_name = "bytes.txt"
        bytes_data = b"test data"
        error = S3Error(
            "Error", "Error", 500, "dummy_request_id", "dummy_host_id", "dummy_response"
        )
        self.client.client.put_object.side_effect = error
        with self.assertRaises(S3Error):
            self.client.upload_bytes(bucket_name, object_name, bytes_data)

    def test_download_file_success(self):
        bucket_name = "test_bucket"
        object_name = "file.txt"
        file_path = "/path/to/download.txt"
        self.client.client.fget_object.return_value = None
        self.client.download_file(bucket_name, object_name, file_path)
        self.client.client.fget_object.assert_called_with(
            bucket_name, object_name, file_path
        )

    def test_download_file_failure(self):
        bucket_name = "test_bucket"
        object_name = "file.txt"
        file_path = "/path/to/download.txt"
        error = S3Error(
            "Error", "Error", 500, "dummy_request_id", "dummy_host_id", "dummy_response"
        )
        self.client.client.fget_object.side_effect = error
        with self.assertRaises(S3Error):
            self.client.download_file(bucket_name, object_name, file_path)

    def test_download_file_as_bytes_success(self):
        bucket_name = "test_bucket"
        object_name = "file.txt"
        expected_data = b"downloaded content"
        dummy_response = DummyResponse(expected_data)
        self.client.client.get_object.return_value = dummy_response
        data = self.client.download_file_as_bytes(bucket_name, object_name)
        self.client.client.get_object.assert_called_with(bucket_name, object_name)
        self.assertEqual(data, expected_data)

    def test_download_file_as_bytes_failure(self):
        bucket_name = "test_bucket"
        object_name = "file.txt"
        error = S3Error(
            "Error", "Error", 500, "dummy_request_id", "dummy_host_id", "dummy_response"
        )
        self.client.client.get_object.side_effect = error
        with self.assertRaises(S3Error):
            self.client.download_file_as_bytes(bucket_name, object_name)

    def test_list_objects_success(self):
        bucket_name = "test_bucket"
        dummy_objects = [DummyObject("obj1"), DummyObject("obj2")]
        self.client.client.list_objects.return_value = dummy_objects
        objects = self.client.list_objects(bucket_name)
        self.assertEqual(objects, ["obj1", "obj2"])

    def test_list_objects_failure(self):
        bucket_name = "test_bucket"
        error = S3Error(
            "Error", "Error", 500, "dummy_request_id", "dummy_host_id", "dummy_response"
        )
        self.client.client.list_objects.side_effect = error
        with self.assertRaises(S3Error):
            self.client.list_objects(bucket_name)

    def test_get_uri(self):
        bucket_name = "test_bucket"
        object_name = "file.txt"
        expected_uri = f"http://{self.endpoint}/{bucket_name}/{object_name}"
        uri = self.client.get_uri(bucket_name, object_name)
        self.assertEqual(uri, expected_uri)


if __name__ == "__main__":
    unittest.main()
