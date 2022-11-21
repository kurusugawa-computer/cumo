from __future__ import annotations  # Postponed Evaluation of Annotations
from uuid import uuid4
from math import sqrt
from typing import TYPE_CHECKING
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer
# pylint: disable=no-member


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


def set_camera_roll(
    self: PointCloudViewer,
    angle_rad: float,
    up_x: float = 0,
    up_y: float = 1,
    up_z: float = 0,
) -> None:
    """カメラのロール(視線を軸とした回転角度)を設定する。

    Args:
        roll_rad (float): 回転角度。ラジアンで指定する
        up_x (float): 回転角度の基準となるベクトルのx成分。この方向が画面の上を指す状態が0度になる
        up_y (float): 回転角度の基準となるベクトルのy成分。この方向が画面の上を指す状態が0度になる
        up_z (float): 回転角度の基準となるベクトルのz成分。この方向が画面の上を指す状態が0度になる
    """

    norm_sq = up_x*up_x + up_y*up_y + up_z*up_z
    if norm_sq == 0:
        raise ValueError("up must not be zero")

    norm = sqrt(norm_sq)

    up = server_pb2.VecXYZf()
    up.x = up_x / norm
    up.y = up_y / norm
    up.z = up_z / norm

    roll = server_pb2.SetCamera.Roll()
    roll.angle = angle_rad
    roll.up.CopyFrom(up)

    camera = server_pb2.SetCamera()
    camera.roll.CopyFrom(roll)

    obj = server_pb2.ServerCommand()
    obj.set_camera.CopyFrom(camera)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def set_camera_roll_lock(
    self: PointCloudViewer,
    enable: bool,
):
    """カメラのロールを固定し、画面の上側が常に同じ方向を向くようにする機能を有効化、または無効化する。

    Args:
        enable (bool): Trueにセットすることでカメラの"上"が固定され、それが変更されるようなマウス操作が無効化される。
    """
    camera = server_pb2.SetCamera()
    camera.roll_lock = enable

    obj = server_pb2.ServerCommand()
    obj.set_camera.CopyFrom(camera)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
