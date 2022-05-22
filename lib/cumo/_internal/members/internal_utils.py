from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
import multiprocessing
from cumo._internal.server import multiprocessing_worker
if TYPE_CHECKING:
    from cumo import PointCloudViewer


# pylint: disable=no-member

def __init__(
    self: PointCloudViewer,
    host: str = "127.0.0.1",
    websocket_port: int = 8081,
    http_port: int = 8082,
    autostart: bool = False
) -> None:
    self._custom_handlers = {}
    self._key_event_handlers = {}
    self._websocket_broadcasting_queue = multiprocessing.Queue()
    self._websocket_message_queue = multiprocessing.Queue()
    self._server_process = multiprocessing.Process(
        target=multiprocessing_worker,
        args=(
            host,
            websocket_port,
            http_port,
            self._websocket_broadcasting_queue,
            self._websocket_message_queue
        ),
        daemon=True
    )
    if autostart:
        self.start()
