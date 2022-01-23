from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from uuid import UUID, uuid4
from typing import Callable, Optional
from pointcloud_viewer._internal.protobuf import server_pb2

def set_custom_slider(
    self: PointCloudViewer,
    target: UUID,
    name: Optional[str] = None,
    min: Optional[float]= None,
    max: Optional[float] = None,
    step: Optional[float] = None,
    value: Optional[float] = None,
    on_changed: Optional[Callable[[float], None]] = None,
) -> UUID:
    """指定されたスライダーの値を変更する。

    :param target: スライダーの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param min: 最小値
    :type min: Optional[float], optional
    :param max: 最大値
    :type max: Optional[float], optional
    :param step: 最小の変化量
    :type step: Optional[float], optional
    :param value: 値
    :type value: Optional[float], optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にスライダーの設定値が渡される
    :type on_changed: Optional[Callable[[float], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    obj = server_pb2.ServerCommand()
    slider = server_pb2.SetCustomControl.Slider()
    slider.name = name if name is not None else slider.name
    slider.min = min if min is not None else slider.min
    slider.max = max if max is not None else slider.max
    slider.step = step if step is not None else slider.step
    slider.value = value if value is not None else slider.value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.slider.CopyFrom(slider)
    set_custom_control.target = str(target)
    obj.set_custom_control.CopyFrom(set_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def set_custom_checkbox(
    self: PointCloudViewer,
    target: UUID,
    name: Optional[str] = None,
    value: Optional[bool] = None,
    on_changed: Optional[Callable[[bool], None]] = None,
) -> UUID:
    """指定されたチェックボックスの値を変更する。

    :param target: チェックボックスの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param value: 値
    :type value: Optional[bool], optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にチェックボックスの設定値が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    checkbox = server_pb2.SetCustomControl.CheckBox()
    checkbox.name = name if name is not None else checkbox.name
    checkbox.value = value if value is not None else checkbox.value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.checkbox.CopyFrom(checkbox)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)
    

def set_custom_textbox(
    self: PointCloudViewer,
    target: UUID,
    name: Optional[str] = None,
    value: Optional[str] = None,
    on_changed: Optional[Callable[[str], None]] = None,
) -> UUID:
    """指定されたテキストボックスの値を変更する。

    :param target: テキストボックスの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param value: 値
    :type value: Optional[str], optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にテキストボックスの設定値が渡される
    :type on_changed: Optional[Callable[[str], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    textbox = server_pb2.SetCustomControl.TextBox()
    textbox.name = name if name is not None else textbox.name
    textbox.value = value if value is not None else textbox.value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.textbox.CopyFrom(textbox)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def set_custom_selectbox(
    self: PointCloudViewer,
    target: UUID,
    items: Optional[list] = None,
    name: Optional[str] = None,
    value: Optional[int] = None,
    on_changed: Optional[Callable[[int], None]] = None,
) -> UUID:
    """指定されたセレクトボックスの値を変更する。

    :param target: セレクトボックスの UUID
    :type target: UUID
    :param items: 要素の文字列のリスト
    :type items: Optional[list], optional
    :param name: 表示名
    :type name: Optional[str], optional
    :param value: 値
    :type value: Optional[int], optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にセレクトボックスの設定値が渡される
    :type on_changed: Optional[Callable[[int], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    selectbox = server_pb2.SetCustomControl.SelectBox()
    selectbox.name = name if name is not None else selectbox.name
    if items is not None:
        selectbox.items.extend(items)
    selectbox.value = value if value is not None else selectbox.value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.selectbox.CopyFrom(selectbox)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def set_custom_button(
    self: PointCloudViewer,
    target: UUID,
    name: Optional[str] = None,
    on_click: Optional[Callable[[], None]] = None,
) -> UUID:
    """指定されたボタンの値を変更する。

    :param target: ボタンの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param on_click: ボタンがクリックされたときに呼ばれるコールバック関数
    :type on_click: Optional[Callable[[], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    button = server_pb2.SetCustomControl.Button()
    button.name = name if name is not None else button.name
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.button.CopyFrom(button)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "clicked", on_click)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def set_custom_colorpicker(
    self: PointCloudViewer,
    target: UUID,
    name: Optional[str] = None,
    value: Optional[str] = None,
    on_changed: Optional[Callable[[], None]] = None,
) -> UUID:
    """指定されたフォルダーのカラーピッカーを変更する。

    :param target: フォルダーの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param value: 値
    :type value: Optional[str], optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数
    :type on_changed: Optional[Callable[[], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    picker = server_pb2.SetCustomControl.Colorpicker()
    picker.name = name if name is not None else picker.name
    picker.value = value if value is not None else picker.value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.colorpicker.CopyFrom(picker)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)
