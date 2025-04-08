# Storage

The Storage Library provides a unified interface for interacting with bucket-based storage systems. Currently, it includes an implementation for Minio via the `MinioStorageClient`. The design is extensible so that future implementations (e.g., AWS S3, Google Cloud Storage) can be added seamlessly by conforming to the `StorageClient` interface.

## Features

- **Unified Interface:**
  Implements a common interface (`StorageClient`) for storage operations, ensuring consistent usage across different providers.
- **Bucket Operations:**
  Supports creating buckets, listing buckets, and listing objects within buckets.

- **Object Operations:**
  Provides methods to upload files or raw bytes (or BytesIO data) and to download files either as local files or as bytes.

- **URI Generation:**
  Generates URIs for accessing stored objects, making integration with external systems easier.

## Installation

Add the Storage library to your monorepo by running:

```bash
npx nx run <project>:add --name ddd-infra-storage --local
```

Ensure that your environment has all required dependencies, including `minio` and your logger library.

## Usage

### Instantiating the Minio Storage Client

To begin using the Minio storage client, import and instantiate `MinioStorageClient` with the appropriate connection parameters:

```python
from storage.minio.storage import MinioStorageClient

# Initialize the client with your Minio endpoint and credentials.
minio_client = MinioStorageClient(
    endpoint="minio.example.com",
    access_key="your_access_key",
    secret_key="your_secret_key",
    secure=False
)
```

### Creating a Bucket

Create a new bucket on the Minio server:

```python
bucket_name = "my_bucket"
minio_client.create_bucket(bucket_name)
```

### Listing Buckets

Retrieve a list of all buckets available on the Minio server:

```python
buckets = minio_client.list_buckets()
print("Buckets:", buckets)
```

### Uploading Files and Bytes

#### Upload a File

Upload a local file to a specified bucket and obtain its URI:

```python
uri = minio_client.upload_file("my_bucket", "example.txt", "path/to/local/file.txt")
print("File uploaded to:", uri)
```

#### Upload Raw Bytes

Upload data as bytes (or using a BytesIO instance) and get its URI:

```python
# Upload using raw bytes
uri = minio_client.upload_bytes("my_bucket", "data.txt", b"Sample data")
print("Data uploaded to:", uri)

# Upload using a BytesIO instance
from io import BytesIO
bytes_io = BytesIO(b"Sample data from BytesIO")
uri = minio_client.upload_bytes("my_bucket", "data_bytesio.txt", bytes_io)
print("Data uploaded to:", uri)
```

### Downloading Files and Bytes

#### Download a File Locally

Download an object from a bucket and save it to a local file:

```python
minio_client.download_file("my_bucket", "example.txt", "path/to/save/example.txt")
```

#### Download as Bytes

Download an object from a bucket and obtain its data as bytes:

```python
data = minio_client.download_file_as_bytes("my_bucket", "example.txt")
print("Downloaded data:", data)
```

### Listing Objects in a Bucket

Retrieve a list of object names stored in a specific bucket:

```python
objects = minio_client.list_objects("my_bucket")
print("Objects in bucket:", objects)
```

### Generating Object URIs

Generate a URI to access an object stored in a bucket:

```python
uri = minio_client.get_uri("my_bucket", "example.txt")
print("Access URI:", uri)
```

## Configuration Details

- **Minio Connection:**
  The client is configured with the Minio server’s endpoint and credentials. Use the `secure` flag to toggle between HTTP and HTTPS.

- **Logging:**
  All operations log detailed messages using the integrated logger. Adjust or replace the logger if needed.

- **Extensibility:**
  The library is designed around the `StorageClient` interface. Future implementations for other storage providers can be added with minimal changes to the application code.

## Testing

Unit tests are provided to ensure that all functionality works as expected. To run the tests, navigate to the library’s directory and execute:

```bash
npx nx test ddd-infra-storage
```
