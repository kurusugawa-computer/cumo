from __future__ import annotations # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

import multiprocessing
from pointcloud_viewer._internal.server import multiprocessing_worker

def __init__(
    self: PointCloudViewer,
    host: str = "127.0.0.1",
    websocket_port: int = 8081,
    http_port: int = 8082,
    autostart: bool = False
) -> None:
    self._custom_handlers = dict()
    self._key_event_handlers = dict()
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
