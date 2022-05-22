from __future__ import annotations  # Postponed Evaluation of Annotations
from uuid import UUID, uuid4
from typing import Callable, TYPE_CHECKING
from cumo._internal.protobuf import server_pb2
from cumo.keyboard_event import KeyboardEvent
if TYPE_CHECKING:
    from cumo import PointCloudViewer

# pylint: disable=no-member


def add_keyup_handler(
    self: PointCloudViewer,
    handler: Callable[[KeyboardEvent, UUID], None]
) -> UUID:
    """ブラウザでkeyupイベントが発生したときに呼ばれるハンドラーを登録する。

    Args:
        handler (Callable[[KeyboardEvent, UUID], None]): ブラウザでkeyupイベントが発生したときに呼ばれるハンドラー

    Returns:
        UUID: ハンドラーに対応するID。後から操作する際に使う
    """
    uuid = uuid4()
    if "keyup" not in self._key_event_handlers:
        self._key_event_handlers["keyup"] = {}
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
    """ブラウザでkeyupイベントが発生したときに呼ばれるハンドラーを削除する。

    Args:
        uuid (UUID): ブラウザでkeyupイベントが発生したときに呼ばれるハンドラーのID
    """
    if "keyup" not in self._key_event_handlers:
        raise KeyError(uuid)
    if uuid not in self._key_event_handlers["keyup"]:
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
    """ブラウザでkeydownイベントが発生したときに呼ばれるハンドラーを登録する。

    Args:
        handler (Callable[[KeyboardEvent, UUID], None]): ブラウザでkeydownイベントが発生したときに呼ばれるハンドラー

    Returns:
        UUID: ハンドラーに対応するID。後から操作する際に使う
    """
    uuid = uuid4()
    if "keydown" not in self._key_event_handlers:
        self._key_event_handlers["keydown"] = {}
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
    """ブラウザでkeydownイベントが発生したときに呼ばれるハンドラーを削除する。

    Args:
        uuid (UUID): ブラウザでkeydownイベントが発生したときに呼ばれるハンドラーのID
    """
    if "keydown" not in self._key_event_handlers:
        raise KeyError(uuid)
    if uuid not in self._key_event_handlers["keydown"]:
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
    """ブラウザでkeypressイベントが発生したときに呼ばれるハンドラーを登録する。

    Args:
        handler (Callable[[KeyboardEvent, UUID], None]): ブラウザでkeypressイベントが発生したときに呼ばれるハンドラー

    Returns:
        UUID: ハンドラーに対応するID。後から操作する際に使う
    """
    uuid = uuid4()
    if "keypress" not in self._key_event_handlers:
        self._key_event_handlers["keypress"] = {}
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
    """ブラウザでkeypressイベントが発生したときに呼ばれるハンドラーを削除する。

    Args:
        uuid (UUID): ブラウザでkeypressイベントが発生したときに呼ばれるハンドラーのID
    """
    if "keypress" not in self._key_event_handlers:
        raise KeyError(uuid)
    if uuid not in self._key_event_handlers["keypress"]:
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
