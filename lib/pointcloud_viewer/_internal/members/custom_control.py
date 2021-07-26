from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from uuid import uuid4
from typing import Callable, Optional
from pointcloud_viewer._internal.protobuf import server_pb2


def add_custom_slider(
    self: PointCloudViewer,
    name: str = "slider",
    min: float = 0,
    max: float = 100,
    step: float = 1,
    init_value: float = 50,
    on_changed: Optional[Callable[[float], None]] = None,
) -> None:
    """カスタムフォルダにスライダーを追加する。

    :param name: 表示名
    :type name: str, optional
    :param min: 最小値
    :type min: float, optional
    :param max: 最大値
    :type max: float, optional
    :param step: 最小の変化量
    :type step: float, optional
    :param init_value: 初期値
    :type init_value: float, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にスライダーの設定値が渡される
    :type on_changed: Optional[Callable[[float], None]], optional
    """
    obj = server_pb2.ServerCommand()
    slider = server_pb2.CustomControl.Slider()
    slider.name = name
    slider.min = min
    slider.max = max
    slider.step = step
    slider.init_value = init_value
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.slider.CopyFrom(slider)
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def add_custom_checkbox(
    self: PointCloudViewer,
    name: str = "checkbox",
    init_value: bool = False,
    on_changed: Optional[Callable[[bool], None]] = None,
) -> None:
    """カスタムフォルダーにチェックボックスを追加する。

    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値
    :type init_value: bool, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にチェックボックスの設定値が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional
    """
    checkbox = server_pb2.CustomControl.CheckBox()
    checkbox.name = name
    checkbox.init_value = init_value
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.checkbox.CopyFrom(checkbox)
    obj = server_pb2.ServerCommand()
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def add_custom_textbox(
    self: PointCloudViewer,
    name: str = "textbox",
    init_value: str = "",
    on_changed: Optional[Callable[[bool], None]] = None,
) -> None:
    """カスタムフォルダーにテキストボックスを追加する。

    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値
    :type init_value: str, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にテキストボックスの値が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional
    """
    textbox = server_pb2.CustomControl.TextBox()
    textbox.name = name
    textbox.init_value = init_value
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.textbox.CopyFrom(textbox)
    obj = server_pb2.ServerCommand()
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def add_custom_selectbox(
    self: PointCloudViewer,
    items: list,
    name: str = "selectbox",
    init_value: str = "",
    on_changed: Optional[Callable[[bool], None]] = None,
) -> None:
    """カスタムフォルダーにセレクトボックスを追加する。

    :param items: 要素の文字列のリスト
    :type items: list
    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値
    :type init_value: str, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数に選択された要素の文字列が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional
    """
    selectbox = server_pb2.CustomControl.SelectBox()
    selectbox.name = name
    selectbox.items.extend(items)
    selectbox.init_value = init_value
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.selectbox.CopyFrom(selectbox)
    obj = server_pb2.ServerCommand()
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def add_custom_button(
    self: PointCloudViewer,
    name: str = "button",
    on_changed: Optional[Callable[[], None]] = None,
) -> None:
    """カスタムフォルダーにボタンを追加する。

    :param name: 表示名
    :type name: str, optional
    :param on_changed: ボタンが押されたときに呼ばれるコールバック関数。引数に ``True`` が渡される
    :type on_changed: Optional[Callable[[], None]], optional
    """
    button = server_pb2.CustomControl.Button()
    button.name = name
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.button.CopyFrom(button)
    obj = server_pb2.ServerCommand()
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def add_custom_colorpicker(
    self: PointCloudViewer,
    name: str = "color",
    init_value: str = "#000",
    on_changed: Optional[Callable[[], None]] = None,
) -> None:
    """カスタムフォルダーにカラーピッカーを追加する。

    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値。 ``#ff0000`` 、 ``rgb(255,0,0)`` 等の表現が利用可能
    :type init_value: str, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数に色を表す文字列が渡される
    :type on_changed: Optional[Callable[[], None]], optional
    """
    picker = server_pb2.CustomControl.ColorPicker()
    picker.name = name
    picker.init_value = init_value
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.color_picker.CopyFrom(picker)
    obj = server_pb2.ServerCommand()
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def remove_all_custom_controls(
    self: PointCloudViewer
) -> None:
    """すべてのカスタムコントロールを削除する。
    """
    remove_custom_control = server_pb2.RemoveCustomControl()
    remove_custom_control.all = True

    obj = server_pb2.ServerCommand()
    obj.remove_custom_control.CopyFrom(remove_custom_control)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)