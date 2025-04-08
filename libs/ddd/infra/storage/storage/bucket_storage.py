from abc import ABC, abstractmethod
from typing import List


class StorageClient(ABC):
    @abstractmethod
    def create_bucket(self, bucket_name: str) -> None:
        """Create a new bucket."""
        pass

    @abstractmethod
    def list_buckets(self) -> List[str]:
        """List all buckets available."""
        pass

    @abstractmethod
    def upload_file(self, bucket_name: str, object_name: str, file_path: str) -> str:
        """Upload a file to a bucket and return its URI."""
        pass

    @abstractmethod
    def upload_bytes(
        self, bucket_name: str, object_name: str, bytes_data: bytes
    ) -> str:
        """Upload bytes data to a bucket and return its URI."""
        pass

    @abstractmethod
    def download_file(self, bucket_name: str, object_name: str, file_path: str) -> None:
        """Download an object from a bucket and save it locally."""
        pass

    @abstractmethod
    def download_file_as_bytes(self, bucket_name: str, object_name: str) -> bytes:
        """Download an object from a bucket and return its data as bytes."""
        pass

    @abstractmethod
    def list_objects(self, bucket_name: str) -> List[str]:
        """List object names in the specified bucket."""
        pass

    @abstractmethod
    def get_uri(self, bucket_name: str, object_name: str) -> str:
        """Generate a URI to access an object."""
        pass
