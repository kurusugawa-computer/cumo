from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from uuid import uuid4
from pointcloud_viewer._internal.protobuf import server_pb2


def set_orthographic_camera(
    self: PointCloudViewer,
    frustum_height: float = 30,
) -> None:
    """カメラを正投影カメラに切り替えさせる。

    :param frustum_height: カメラの視錐台の高さ。幅はウィンドウのアスペクト比から計算される
    :type frustum_height: float, optional
    """
    camera = server_pb2.SetCamera()
    camera.orthographic_frustum_height = frustum_height
    obj = server_pb2.ServerCommand()
    obj.set_camera.CopyFrom(camera)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def set_perspective_camera(
    self: PointCloudViewer,
    fov: float = 30,
) -> None:
    """カメラを遠近投影カメラに切り替えさせる。

    :param fov: 視野角
    :type fov: float, optional
    """
    camera = server_pb2.SetCamera()
    camera.perspective_fov = fov
    obj = server_pb2.ServerCommand()
    obj.set_camera.CopyFrom(camera)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def set_camera_position(
    self: PointCloudViewer,
    x: float,
    y: float,
    z: float,
) -> None:
    """カメラの位置を変更する。

    :param x: カメラのx座標
    :type x: float
    :param y: カメラのy座標
    :type y: float
    :param z: カメラのz座標
    :type z: float
    """
    position = server_pb2.VecXYZf()
    position.x = x
    position.y = y
    position.z = z

    camera = server_pb2.SetCamera()
    camera.position.CopyFrom(position)

    obj = server_pb2.ServerCommand()
    obj.set_camera.CopyFrom(camera)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def set_camera_target(
    self: PointCloudViewer,
    x: float,
    y: float,
    z: float,
) -> None:
    """カメラが向く目標の座標を変更する。

    :param x: 目標のx座標
    :type x: float
    :param y: 目標のy座標
    :type y: float
    :param z: 目標のz座標
    :type z: float
    """
    target = server_pb2.VecXYZf()
    target.x = x
    target.y = y
    target.z = z

    camera = server_pb2.SetCamera()
    camera.target.CopyFrom(target)

    obj = server_pb2.ServerCommand()
    obj.set_camera.CopyFrom(camera)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def get_camera_position(
    self: PointCloudViewer,
) -> server_pb2.VecXYZf:  # debug
    """ カメラのpositionを取得する.．

    """
    obj = server_pb2.ServerCommand()
    obj.camera_position = True
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if ret.HasField("camera_position"):
        return ret.camera_position


def get_camera_rotation(
    self: PointCloudViewer,
) -> server_pb2.VecXYZf:  # debug
    """ カメラのrotationを取得する.．

    """
    obj = server_pb2.ServerCommand()
    obj.camera_rotation = True
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if ret.HasField("camera_rotation"):
        return ret.camera_rotation


def get_camera_target(
    self: PointCloudViewer,
) -> server_pb2.VecXYZf:  # debug
    """ カメラのtargetを取得する.．

    """
    obj = server_pb2.ServerCommand()
    obj.camera_target = True
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if ret.HasField("camera_target"):
        return ret.camera_target
