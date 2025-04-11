class InMemoryRepository:
    def __init__(self) -> None:
        self._store: dict[str, dict[str, any]] = {}

    def create_status(self, key: str, status: str) -> None:
        """
        Create a new status entry in the repository.
        Args:
            key (str): The key for the status entry.
            status (str): The initial status.
        """
        self._store[key] = {"global_status": status, "threads": {}}

    def update_status(self, key: str, status: str) -> None:
        """
        Update the global status of an existing entry.
        Args:
            key (str): The key for the status entry.
            status (str): The new global status.
        """
        if key in self._store:
            self._store[key]["global_status"] = status

    def update_thread_status(self, key: str, thread_id: int, status: str) -> None:
        """
        Update the status of a specific thread in an existing entry.
        Args:
            key (str): The key for the status entry.
            thread_id (int): The ID of the thread to update.
            status (str): The new status for the thread.
        """
        if key in self._store:
            self._store[key]["threads"][thread_id] = status

    def get_status(self, key: str) -> dict[str, any] | None:
        """
        Retrieve the status entry for a given key.
        Args:
            key (str): The key for the status entry.
        Returns:
            dict[str, any] | None: The status entry if found, otherwise None.
        """
        return self._store.get(key)
