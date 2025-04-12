# In-Memory Repository

The In-Memory Repository Library provides a lightweight, transient storage mechanism for status data during runtime. It is designed to facilitate quick state management for components such as background tasks or microservices, keeping track of global and thread-specific statuses in memory.

## Features

- **In-Memory Data Storage:**
  Uses a Python dictionary to store status entries for quick retrieval and updates.
- **Flexible Status Management:**
  Supports creating new status entries and updating global or thread-specific statuses.
- **Thread-Safe Operations:**
  Employs a locking mechanism to ensure that user IDs are managed safely across threads.

## Installation

Add the In-Memory Repository library to your monorepo by running:

```bash
npx nx run <project>:add --name ddd-inmemory --local
```

Ensure that your environment is configured for Python development and that any necessary dependencies are installed.

## Usage

### Creating an In-Memory Repository Instance

First, import and instantiate the repository:

```python
from mem_reposiriry.in_memory_repository import InMemoryRepository

# Create a repository instance
repo = InMemoryRepository()
```

### Creating and Updating Status

You can create a new status entry, update the global status, and update the status of individual threads as follows:

```python
# Create a new status entry
repo.create_status("emulation1", "pending")

# Update the global status
repo.update_status("emulation1", "running")

# Update the status of a specific thread (e.g., thread 1)
repo.update_thread_status("emulation1", thread_id=1, status="processing")
```

### Retrieving the Status Entry

To retrieve the status for a given key:

```python
status = repo.get_status("emulation1")
print(status)
# Example output: {"global_status": "running", "threads": {1: "processing"}}
```
