from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
from uuid import uuid4
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer


# pylint: disable=no-member,redefined-builtin

def set_pan_speed(
    self: PointCloudViewer,
    speed: float,
) -> None:
    config = server_pb2.SetConfig()
    config.panSpeed = speed

    obj = server_pb2.ServerCommand()
    obj.set_config.CopyFrom(config)
    uuid = uuid4()
    self._send_data(obj, uuid)

    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")


def set_zoom_speed(
    self: PointCloudViewer,
    speed: float,
) -> None:
    config = server_pb2.SetConfig()
    config.zoomSpeed = speed

    obj = server_pb2.ServerCommand()
    obj.set_config.CopyFrom(config)
    uuid = uuid4()
    self._send_data(obj, uuid)

    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")


def set_rotate_speed(
    self: PointCloudViewer,
    speed: float,
) -> None:
    config = server_pb2.SetConfig()
    config.rotateSpeed = speed

    obj = server_pb2.ServerCommand()
    obj.set_config.CopyFrom(config)
    uuid = uuid4()
    self._send_data(obj, uuid)

    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")


def set_roll_speed(
    self: PointCloudViewer,
    speed: float,
) -> None:
    config = server_pb2.SetConfig()
    config.rollSpeed = speed

    obj = server_pb2.ServerCommand()
    obj.set_config.CopyFrom(config)
    uuid = uuid4()
    self._send_data(obj, uuid)

    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")

# cameraのpropertyの操作はcamera.pyに記述されている
