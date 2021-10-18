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
from pointcloud_viewer.keyboard_event import KeyboardEvent


def _wait_until(self: PointCloudViewer, uuid: UUID) -> client_pb2.ClientCommand:
    while True:
        data: bytes = self._websocket_message_queue.get()
        command: client_pb2.ClientCommand = client_pb2.ClientCommand()
        try:
            command.ParseFromString(data)
        except DecodeError:
            raise RuntimeError("failed to parsing message")
        if UUID(hex=command.UUID) == uuid:
            return command
        else:
            self._handle_message(command)


def _handle_message(self: PointCloudViewer, command: client_pb2.ClientCommand):
    if command.HasField("control_changed"):
        _handle_control_changed(self, command)
        return
    if command.HasField("key_event_occurred"):
        _handle_key_event_occurred(self, command)
        return


def _get_custom_handler(self: PointCloudViewer, uuid: UUID, name: str) -> Optional[Callable]:
    t = (uuid, name)
    if t in self._custom_handlers:
        return self._custom_handlers[t]
    return None


def _set_custom_handler(self: PointCloudViewer, uuid: UUID, name: str, func: Callable) -> None:
    self._custom_handlers[(uuid, name)] = func


def _handle_control_changed(self: PointCloudViewer, command: client_pb2.ClientCommand):
    uuid = UUID(hex=command.UUID)
    on_changed = self._get_custom_handler(uuid, "changed")
    if on_changed != None:
        if command.control_changed.HasField("number"):
            on_changed(command.control_changed.number)
        elif command.control_changed.HasField("text"):
            on_changed(command.control_changed.text)
        elif command.control_changed.HasField("boolean"):
            on_changed(command.control_changed.boolean)


def _handle_key_event_occurred(self: PointCloudViewer, command: client_pb2.ClientCommand):
    if command.key_event_occurred.HasField("keyup"):
        handle_keyup(self, command.key_event_occurred.keyup)
    elif command.key_event_occurred.HasField("keydown"):
        handle_keydown(self, command.key_event_occurred.keydown)
    elif command.key_event_occurred.HasField("keypress"):
        handle_keypress(self, command.key_event_occurred.keypress)

def protobuf_to_keyboardevent(ev_pb:client_pb2.KeyEventOccurred.KeyEvent) -> KeyboardEvent:
    return KeyboardEvent(
        key=ev_pb.key,
        code=ev_pb.code,
        shiftKey=ev_pb.shiftKey,
        altKey=ev_pb.altKey,
        ctrlKey=ev_pb.ctrlKey,
        metaKey=ev_pb.metaKey,
        repeat=ev_pb.repeat,
    )

def handle_keyup(self: PointCloudViewer, ev_pb: client_pb2.KeyEventOccurred.KeyEvent):
    ev = protobuf_to_keyboardevent(ev_pb)
    items = list(self._key_event_handlers["keyup"].items())
    for t in items:
        uuid: UUID = t[0]
        handler: Callable[[KeyboardEvent, UUID], None] = t[1]
        handler(ev, uuid)


def handle_keydown(self: PointCloudViewer, ev_pb: client_pb2.KeyEventOccurred.KeyEvent):
    ev = protobuf_to_keyboardevent(ev_pb)
    items = list(self._key_event_handlers["keydown"].items())
    for t in items:
        uuid: UUID = t[0]
        handler: Callable[[KeyboardEvent, UUID], None] = t[1]
        handler(ev, uuid)


def handle_keypress(self: PointCloudViewer, ev_pb: client_pb2.KeyEventOccurred.KeyEvent):
    ev = protobuf_to_keyboardevent(ev_pb)
    items = list(self._key_event_handlers["keypress"].items())
    for t in items:
        uuid: UUID = t[0]
        handler: Callable[[KeyboardEvent, UUID], None] = t[1]
        handler(ev, uuid)


def _send_data(self: PointCloudViewer, pbobj: server_pb2.ServerCommand, uuid: UUID) -> None:
    pbobj.UUID = str(uuid)
    data = base64.b64encode(pbobj.SerializeToString())
    self._websocket_broadcasting_queue.put(data.decode())
