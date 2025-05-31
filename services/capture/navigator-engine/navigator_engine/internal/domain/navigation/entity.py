from dataclasses import dataclass
from queue import Queue


@dataclass
class NavigationSession:
    id: str
    engine: str
    command_queue: Queue
    response_queue: Queue
    runner: object  # Referência para o runner (Thread ou asyncio Task)

    def enqueue_command(self, command: dict):
        self.command_queue.put(command)

    def get_response(self):
        return self.response_queue.get()
