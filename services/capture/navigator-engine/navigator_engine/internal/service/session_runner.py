import os
import time
from queue import Empty, Queue
from threading import Thread

from seleniumbase import SB


class SessionRunner:
    def __init__(self, engine):
        self.engine = engine
        self.command_queue = Queue()
        self.response_queue = Queue()
        self.running = True
        self._proxy = None
        self._thread = Thread(target=self._run, daemon=True)

    def start(self):
        self._thread.start()

    def _run(self):
        with SB(
            uc=True,
            headless=True,
            incognito=False,
            disable_js=False,
            proxy=self._proxy,
        ) as sb:
            while self.running:
                try:
                    cmd = self.command_queue.get(timeout=1)
                    result = self._handle_cmd(sb, cmd)
                    self.response_queue.put(result)
                except Empty:
                    time.sleep(0.1)
                    continue
                except Exception as e:
                    self.response_queue.put({"error": str(e)})
                    continue

    def _handle_cmd(self, sb, cmd):
        local_vars = {
            "self": self,
            "sb": sb,
            "command": cmd,
        }
        exec(cmd, {}, local_vars)
        return {"status": "success"}

    def stop(self):
        self.running = False
