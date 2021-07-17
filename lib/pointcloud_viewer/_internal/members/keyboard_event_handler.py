from __future__ import annotations
# Postponed Evaluation of Annotations
from pointcloud_viewer._internal.protobuf import server_pb2
from typing import Optional, TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from typing import Callable
from pointcloud_viewer.keyboard_event import KeyboardEvent
from uuid import UUID, uuid4


def add_keyup_handler(
    self: PointCloudViewer,
    handler: Callable[[KeyboardEvent, UUID], None]
) -> UUID:
    uuid = uuid4()
    if not "keyup" in self._key_event_handlers:
        self._key_event_handlers["keyup"] = dict()
    self._key_event_handlers["keyup"][uuid] = handler

    set_key_event_handler = server_pb2.SetKeyEventHandler()
    set_key_event_handler.keyup = True
    obj = server_pb2.ServerCommand()
    obj.set_key_event_handler.CopyFrom(set_key_event_handler)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    return uuid


def remove_keyup_handler(
    self: PointCloudViewer,
    uuid: UUID
) -> None:
    if not "keyup" in self._key_event_handlers:
        raise KeyError(uuid)
    if not uuid in self._key_event_handlers["keyup"]:
        raise KeyError(uuid)
    self._key_event_handlers["keyup"].pop(uuid)
    if not bool(self._key_event_handlers["keyup"]):
        # dict is empty
        set_key_event_handler = server_pb2.SetKeyEventHandler()
        set_key_event_handler.keyup = False
        obj = server_pb2.ServerCommand()
        obj.set_key_event_handler.CopyFrom(set_key_event_handler)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

def add_keydown_handler(
    self: PointCloudViewer,
    handler: Callable[[KeyboardEvent, UUID], None]
) -> UUID:
    uuid = uuid4()
    if not "keydown" in self._key_event_handlers:
        self._key_event_handlers["keydown"] = dict()
    self._key_event_handlers["keydown"][uuid] = handler

    set_key_event_handler = server_pb2.SetKeyEventHandler()
    set_key_event_handler.keydown = True
    obj = server_pb2.ServerCommand()
    obj.set_key_event_handler.CopyFrom(set_key_event_handler)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    return uuid


def remove_keydown_handler(
    self: PointCloudViewer,
    uuid: UUID
) -> None:
    if not "keydown" in self._key_event_handlers:
        raise KeyError(uuid)
    if not uuid in self._key_event_handlers["keydown"]:
        raise KeyError(uuid)
    self._key_event_handlers["keydown"].pop(uuid)
    if not bool(self._key_event_handlers["keydown"]):
        # dict is empty
        set_key_event_handler = server_pb2.SetKeyEventHandler()
        set_key_event_handler.keydown = False
        obj = server_pb2.ServerCommand()
        obj.set_key_event_handler.CopyFrom(set_key_event_handler)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

def add_keypress_handler(
    self: PointCloudViewer,
    handler: Callable[[KeyboardEvent, UUID], None]
) -> UUID:
    uuid = uuid4()
    if not "keypress" in self._key_event_handlers:
        self._key_event_handlers["keypress"] = dict()
    self._key_event_handlers["keypress"][uuid] = handler

    set_key_event_handler = server_pb2.SetKeyEventHandler()
    set_key_event_handler.keypress = True
    obj = server_pb2.ServerCommand()
    obj.set_key_event_handler.CopyFrom(set_key_event_handler)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    return uuid


def remove_keypress_handler(
    self: PointCloudViewer,
    uuid: UUID
) -> None:
    if not "keypress" in self._key_event_handlers:
        raise KeyError(uuid)
    if not uuid in self._key_event_handlers["keypress"]:
        raise KeyError(uuid)
    self._key_event_handlers["keypress"].pop(uuid)
    if not bool(self._key_event_handlers["keypress"]):
        # dict is empty
        set_key_event_handler = server_pb2.SetKeyEventHandler()
        set_key_event_handler.keypress = False
        obj = server_pb2.ServerCommand()
        obj.set_key_event_handler.CopyFrom(set_key_event_handler)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)