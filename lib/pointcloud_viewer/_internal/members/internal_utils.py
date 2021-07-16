from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

import base64
from uuid import UUID
from typing import Callable, Optional

from google.protobuf.message import DecodeError

from pointcloud_viewer._internal.protobuf import server_pb2
from pointcloud_viewer._internal.protobuf import client_pb2


def __init__(
    self: PointCloudViewer,
    host: str = "127.0.0.1",
    websocket_port: int = 8081,
    http_port: int = 8082,
    autostart: bool = False
) -> None:
    self._custom_handlers = dict()
    self._websocket_broadcasting_queue = multiprocessing.Queue()
    self._websocket_message_queue = multiprocessing.Queue()
    self._server_process = multiprocessing.Process(
        target=server.multiprocessing_worker,
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


def _wait_until(self: PointCloudViewer, uuid: UUID) -> client_pb2.ClientCommand:
    while True:
        data: bytes = self._websocket_message_queue.get()
        command: client_pb2.ClientCommand = client_pb2.ClientCommand()
        try:
            command.ParseFromString(data)
        except DecodeError:
            raise RuntimeError("failed to parsing message")
        if UUID(bytes_le=command.UUID) == uuid:
            return command
        else:
            self._handle_message(command)


def _handle_message(self: PointCloudViewer, command: client_pb2.ClientCommand):
    if command.HasField("control_changed"):
        self._handle_control_changed(command)


def _get_custom_handler(self: PointCloudViewer, uuid: UUID, name: str) -> Optional[Callable]:
    if self._custom_handlers[uuid] != None and self._custom_handlers[uuid][name] != None:
        return self._custom_handlers[uuid][name]
    return None


def _set_custom_handler(self: PointCloudViewer, uuid: UUID, name: str, func: Callable) -> None:
    if not uuid in self._custom_handlers:
        self._custom_handlers[uuid] = dict()
    self._custom_handlers[uuid][name] = func


def _handle_control_changed(self: PointCloudViewer, command: client_pb2.ClientCommand):
    uuid = UUID(bytes_le=command.UUID)
    on_changed = self._get_custom_handler(uuid, "changed")
    if on_changed != None:
        if command.control_changed.HasField("number"):
            on_changed(command.control_changed.number)
        elif command.control_changed.HasField("text"):
            on_changed(command.control_changed.text)
        elif command.control_changed.HasField("boolean"):
            on_changed(command.control_changed.boolean)


def _send_data(self: PointCloudViewer, pbobj: server_pb2.ServerCommand, uuid: UUID) -> None:
    pbobj.UUID = uuid.bytes_le
    data = base64.b64encode(pbobj.SerializeToString())
    self._websocket_broadcasting_queue.put(data.decode())
