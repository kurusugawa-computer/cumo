from __future__ import annotations  # Postponed Evaluation of Annotations
from uuid import UUID, uuid4
from math import sqrt, isfinite
from typing import TYPE_CHECKING, Optional, Callable
from cumo._internal.protobuf import server_pb2
from cumo.camera_state import CameraState, Vector3f, CameraMode
if TYPE_CHECKING:
    from cumo import PointCloudViewer
# pylint: disable=no-member

_EVENT_CAMERA_STATE_CHANGED = "camerastatechanged"


def set_orthographic_camera(
    self: PointCloudViewer,
    frustum_height: Optional[float] = None,
) -> None:
    """カメラを正投影カメラに切り替えさせる。

    :param frustum_height: カメラの視錐台の高さ。幅はウィンドウのアスペクト比から計算される
    :type frustum_height: float, optional
    """
    camera = server_pb2.SetCamera()
    if frustum_height is None:
        camera.mode = server_pb2.SetCamera.CameraMode.ORTHOGRAPHIC
    else:
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
    fov: Optional[float] = None,
) -> None:
    """カメラを遠近投影カメラに切り替えさせる。

    :param fov: 視野角
    :type fov: float, optional
    """
    camera = server_pb2.SetCamera()
    if fov is None:
        camera.mode = server_pb2.SetCamera.CameraMode.PERSPECTIVE
    else:
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


def get_camera_state(
    self: PointCloudViewer
) -> CameraState:
    """カメラの状態を取得する

    Args:
        self (PointCloudViewer): _description_

    Raises:
        RuntimeError: _description_

    Returns:
        _type_: _description_
    """
    obj = server_pb2.ServerCommand()
    obj.get_camera_state = True
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.HasField("camera_state"):
        return CameraState(
            position=Vector3f(ret.camera_state.position),
            target=Vector3f(ret.camera_state.target),
            up=Vector3f(ret.camera_state.up),
            mode=CameraMode._FromProtobuf(ret.camera_state.mode),
            roll_lock=ret.camera_state.roll_lock,
            fov=ret.camera_state.fov,
            frustum_height=ret.camera_state.frustum_height
        )
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    raise RuntimeError("unexpected response")


def add_camera_state_changed_handler(
        self: PointCloudViewer,
        handler: Callable[[CameraState, UUID], None],
        interval: float = 0.1
) -> UUID:
    """ブラウザでカメラの状態変化が発生したときに呼ばれるハンドラーを登録する。

    Args:
        handler (Callable[[CameraState, UUID], None]): ブラウザでカメラの状態変化が発生したときに呼ばれるハンドラー
        interval float: イベントの最小発生間隔(秒)。

    Returns:
        UUID: ハンドラーに対応するID。後から操作する際に使う
    """
    if interval < 0 or not isfinite(interval):
        raise ValueError("interval must be finite number zero or greater")
    obj = server_pb2.ServerCommand()
    c = server_pb2.SetCameraStateEventHandler(
        add_with_interval=interval
    )
    obj.set_camera_state_event_handler.CopyFrom(c)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)

    self._set_custom_handler(uuid, _EVENT_CAMERA_STATE_CHANGED, handler)
    return uuid


def remove_camera_state_changed_handler(
    self: PointCloudViewer,
    uuid: Optional[UUID] = None,
) -> None:
    """ブラウザでカメラの状態変化が発生したときに呼ばれるハンドラーを削除する。

    Args:
        uuid (Optional[UUID], optional): 削除するハンドラのUUID、指定しない場合すべて削除する
    """
    if uuid is not None:
        if self._get_custom_handler(uuid, _EVENT_CAMERA_STATE_CHANGED) is None:
            raise KeyError(uuid)
        self._custom_handlers[_EVENT_CAMERA_STATE_CHANGED].pop(uuid)
    else:
        if _EVENT_CAMERA_STATE_CHANGED in self._custom_handlers:
            self._custom_handlers[_EVENT_CAMERA_STATE_CHANGED].clear()
    obj = server_pb2.ServerCommand()
    r = server_pb2.SetCameraStateEventHandler()
    if uuid is not None:
        r.remove_by_uuid = str(uuid)
    else:
        r.remove_all = True
    obj.set_camera_state_event_handler.CopyFrom(r)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
