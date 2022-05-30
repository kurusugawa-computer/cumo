from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING, Callable, Optional
from uuid import UUID, uuid4
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer


# pylint: disable=no-member,redefined-builtin

def set_custom_slider(
    self: PointCloudViewer,
    target: UUID,
    name: Optional[str] = None,
    min_value: Optional[float] = None,
    max_value: Optional[float] = None,
    step: Optional[float] = None,
    value: Optional[float] = None,
    on_changed: Optional[Callable[[float], None]] = None,
) -> UUID:
    """指定されたスライダーの値を変更する。

    :param target: スライダーの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param min_value: 最小値
    :type min_value: Optional[float], optional
    :param max_value: 最大値
    :type max_value: Optional[float], optional
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
    if name is not None:
        slider.name = name
    if min_value is not None:
        slider.min = min_value
    if max_value is not None:
        slider.max = max_value
    if step is not None:
        slider.step = step
    if value is not None:
        slider.value = value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.slider.CopyFrom(slider)
    set_custom_control.target = str(target)
    obj.set_custom_control.CopyFrom(set_custom_control)
    if on_changed is not None:
        self._set_custom_handler(target, "changed", on_changed)
    uuid = uuid4()
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
    if name is not None:
        checkbox.name = name
    if value is not None:
        checkbox.value = value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.checkbox.CopyFrom(checkbox)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    if on_changed is not None:
        self._set_custom_handler(target, "changed", on_changed)
    uuid = uuid4()
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
    on_changed: Optional[Callable[[bool], None]] = None,
) -> UUID:
    """指定されたテキストボックスの値を変更する。

    :param target: テキストボックスの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param value: 値
    :type value: Optional[str], optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にテキストボックスの設定値が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    textbox = server_pb2.SetCustomControl.TextBox()
    if name is not None:
        textbox.name = name
    if value is not None:
        textbox.value = value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.textbox.CopyFrom(textbox)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    if on_changed is not None:
        self._set_custom_handler(target, "changed", on_changed)
    uuid = uuid4()
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
    if name is not None:
        selectbox.name = name
    if value is not None:
        selectbox.value = value
    if items is not None:
        selectbox.items.extend(items)
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.selectbox.CopyFrom(selectbox)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    if on_changed is not None:
        self._set_custom_handler(target, "changed", on_changed)
    uuid = uuid4()
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
    on_changed: Optional[Callable[[bool], None]] = None,
) -> UUID:
    """指定されたボタンの値を変更する。

    :param target: ボタンの UUID
    :type target: UUID
    :param name: 表示名
    :type name: Optional[str], optional
    :param on_changed: ボタンがクリックされたときに呼ばれるコールバック関数
    :type on_changed: Optional[Callable[[bool], None]], optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    button = server_pb2.SetCustomControl.Button()
    if name is not None:
        button.name = name
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.button.CopyFrom(button)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    if on_changed is not None:
        self._set_custom_handler(target, "changed", on_changed)
    uuid = uuid4()
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
    picker = server_pb2.SetCustomControl.ColorPicker()
    if name is not None:
        picker.name = name
    if value is not None:
        picker.value = value
    set_custom_control = server_pb2.SetCustomControl()
    set_custom_control.color_picker.CopyFrom(picker)
    set_custom_control.target = str(target)
    obj = server_pb2.ServerCommand()
    obj.set_custom_control.CopyFrom(set_custom_control)
    if on_changed is not None:
        self._set_custom_handler(target, "changed", on_changed)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)
