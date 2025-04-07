from io import BytesIO
from typing import List

# You can replace the following logger with your own logger library
from logger.log import get_logger_from_env
from minio import Minio
from minio.error import S3Error
from storage.bucket_storage import StorageClient

logger = get_logger_from_env(__name__)


class MinioStorageClient(StorageClient):
    """
    MinioStorageClient provides an implementation of the StorageClient interface
    for interacting with a Minio server.
    """

    def __init__(
        self, endpoint: str, access_key: str, secret_key: str, secure: bool = False
    ):
        self._endpoint = endpoint
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure,
        )

    def create_bucket(self, bucket_name: str) -> None:
        """
        Create a new bucket in the Minio server.

        Args:
            bucket_name (str): The name of the bucket to create.

        Returns:
            None
        """
        try:
            self.client.make_bucket(bucket_name)
            logger.info(f"Bucket '{bucket_name}' created successfully")
        except S3Error as err:
            logger.error(f"Error creating bucket '{bucket_name}': {err}")
            raise

    def list_buckets(self) -> List[str]:
        """
        List all buckets available in the Minio server.

        Returns:
            List[str]: A list of bucket names.
        """
        try:
            buckets = self.client.list_buckets()
            return [bucket.name for bucket in buckets]
        except S3Error as err:
            logger.error(f"Error listing buckets: {err}")
            raise

    def upload_file(self, bucket_name: str, object_name: str, file_path: str) -> str:
        """
        Upload a file to a bucket and return its URI.

        Args:
            bucket_name (str): The name of the bucket.
            object_name (str): The name of the object.
            file_path (str): The local path to the file.

        Returns:
            str: The URI of the uploaded object.
        """
        try:
            self.client.fput_object(bucket_name, object_name, file_path)
            uri = self.get_uri(bucket_name, object_name)
            logger.info(f"File '{file_path}' uploaded to '{uri}'")
            return uri
        except S3Error as err:
            logger.error(f"Error uploading file '{file_path}': {err}")
            raise

    def upload_bytes(
        self, bucket_name: str, object_name: str, bytes_data: bytes
    ) -> str:
        """
        Upload bytes data to a bucket and return its URI.

        Args:
            bucket_name (str): The name of the bucket.
            object_name (str): The name of the object.
            bytes_data (bytes): The data to upload. This can be either a bytes object or a BytesIO instance.

        Returns:
            str: The URI of the uploaded object.
        """
        try:
            if isinstance(bytes_data, BytesIO):
                data_stream = bytes_data
            else:
                data_stream = BytesIO(bytes_data)
            data_size = data_stream.getbuffer().nbytes
            self.client.put_object(bucket_name, object_name, data_stream, data_size)
            uri = self.get_uri(bucket_name, object_name)
            logger.info(f"Bytes data uploaded to '{uri}'")
            return uri
        except S3Error as err:
            logger.error(f"Error uploading bytes data: {err}")
            raise

    def download_file(self, bucket_name: str, object_name: str, file_path: str) -> None:
        """
        Download an object from a bucket and save it locally.

        Args:
            bucket_name (str): The name of the bucket.
            object_name (str): The name of the object.
            file_path (str): The local path to save the downloaded file.

        Returns:
            None
        """
        try:
            self.client.fget_object(bucket_name, object_name, file_path)
            logger.info(f"File '{object_name}' downloaded to '{file_path}'")
        except S3Error as err:
            logger.error(f"Error downloading file '{object_name}': {err}")
            raise

    def download_file_as_bytes(self, bucket_name: str, object_name: str) -> bytes:
        """
        Download an object from a bucket and return its data as bytes.

        Args:
            bucket_name (str): The name of the bucket.
            object_name (str): The name of the object.

        Returns:
            bytes: The data of the object as bytes.
        """
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            logger.info(f"File '{object_name}' downloaded as bytes")
            return data
        except S3Error as err:
            logger.error(f"Error downloading file '{object_name}' as bytes: {err}")
            raise

    def list_objects(self, bucket_name: str) -> List[str]:
        """
        List object names in the specified bucket.

        Args:
            bucket_name (str): The name of the bucket.

        Returns:
            List[str]: A list of object names in the bucket.
        """
        try:
            objects = self.client.list_objects(bucket_name)
            return [obj.object_name for obj in objects]
        except S3Error as err:
            logger.error(f"Error listing objects in bucket '{bucket_name}': {err}")
            raise

    def get_uri(self, bucket_name: str, object_name: str) -> str:
        """
        Generate a URI to access an object in the bucket.

        Args:
            bucket_name (str): The name of the bucket.
            object_name (str): The name of the object.

        Returns:
            str: The URI to access the object.
        """
        return f"http://{self._endpoint}/{bucket_name}/{object_name}"
