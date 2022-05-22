from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING, Callable, Optional
from uuid import UUID, uuid4
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer


# pylint: disable=no-member, redefined-builtin


def add_custom_slider(
    self: PointCloudViewer,
    name: str = "slider",
    min_value: float = 0,
    max_value: float = 100,
    step: float = 1,
    init_value: float = 50,
    on_changed: Optional[Callable[[float], None]] = None,
    parent: UUID = UUID(int=0),
) -> UUID:
    """カスタムフォルダにスライダーを追加する。

    :param name: 表示名
    :type name: str, optional
    :param min_value: 最小値
    :type min_value: float, optional
    :param max_value: 最大値
    :type max_value: float, optional
    :param step: 最小の変化量
    :type step: float, optional
    :param init_value: 初期値
    :type init_value: float, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にスライダーの設定値が渡される
    :type on_changed: Optional[Callable[[float], None]], optional
    :param parent: 親フォルダーのUUID。特に指定しない場合はルートフォルダーになる。
    :type parent: UUID, optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    obj = server_pb2.ServerCommand()
    slider = server_pb2.CustomControl.Slider()
    slider.name = name
    slider.min = min_value
    slider.max = max_value
    slider.step = step
    slider.init_value = init_value
    slider.parent = str(parent)
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.slider.CopyFrom(slider)
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._set_custom_handler(uuid, "changed", on_changed)
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def add_custom_checkbox(
    self: PointCloudViewer,
    name: str = "checkbox",
    init_value: bool = False,
    on_changed: Optional[Callable[[bool], None]] = None,
    parent: UUID = UUID(int=0),
) -> UUID:
    """カスタムフォルダーにチェックボックスを追加する。

    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値
    :type init_value: bool, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にチェックボックスの設定値が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional
    :param parent: 親フォルダーのUUID。特に指定しない場合はルートフォルダーになる。
    :type parent: UUID, optional


    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    checkbox = server_pb2.CustomControl.CheckBox()
    checkbox.name = name
    checkbox.init_value = init_value
    checkbox.parent = str(parent)
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
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def add_custom_textbox(
    self: PointCloudViewer,
    name: str = "textbox",
    init_value: str = "",
    on_changed: Optional[Callable[[bool], None]] = None,
    parent: UUID = UUID(int=0),
) -> UUID:
    """カスタムフォルダーにテキストボックスを追加する。

    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値
    :type init_value: str, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にテキストボックスの値が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional
    :param parent: 親フォルダーのUUID。特に指定しない場合はルートフォルダーになる。
    :type parent: UUID, optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    textbox = server_pb2.CustomControl.TextBox()
    textbox.name = name
    textbox.init_value = init_value
    textbox.parent = str(parent)
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
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def add_custom_selectbox(
    self: PointCloudViewer,
    items: list,
    name: str = "selectbox",
    init_value: str = "",
    on_changed: Optional[Callable[[bool], None]] = None,
    parent: UUID = UUID(int=0),
) -> UUID:
    """カスタムフォルダーにセレクトボックスを追加する。

    :param items: 要素の文字列のリスト
    :type items: list
    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値
    :type init_value: str, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数に選択された要素の文字列が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional
    :param parent: 親フォルダーのUUID。特に指定しない場合はルートフォルダーになる。
    :type parent: UUID, optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    selectbox = server_pb2.CustomControl.SelectBox()
    selectbox.name = name
    selectbox.items.extend(items)
    selectbox.init_value = init_value
    selectbox.parent = str(parent)
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
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def add_custom_button(
    self: PointCloudViewer,
    name: str = "button",
    on_changed: Optional[Callable[[bool], None]] = None,
    parent: UUID = UUID(int=0),
) -> UUID:
    """カスタムフォルダーにボタンを追加する。

    :param name: 表示名
    :type name: str, optional
    :param on_changed: ボタンが押されたときに呼ばれるコールバック関数。引数に ``True`` が渡される
    :type on_changed: Optional[Callable[[bool], None]], optional
    :param parent: 親フォルダーのUUID。特に指定しない場合はルートフォルダーになる。
    :type parent: UUID, optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    button = server_pb2.CustomControl.Button()
    button.name = name
    button.parent = str(parent)
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
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def add_custom_colorpicker(
    self: PointCloudViewer,
    name: str = "color",
    init_value: str = "#000",
    on_changed: Optional[Callable[[], None]] = None,
    parent: UUID = UUID(int=0),
) -> UUID:
    """カスタムフォルダーにカラーピッカーを追加する。

    :param name: 表示名
    :type name: str, optional
    :param init_value: 初期値。 ``#ff0000`` 、 ``rgb(255,0,0)`` 等の表現が利用可能
    :type init_value: str, optional
    :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数に色を表す文字列が渡される
    :type on_changed: Optional[Callable[[], None]], optional
    :param parent: 親フォルダーのUUID。特に指定しない場合はルートフォルダーになる。
    :type parent: UUID, optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    picker = server_pb2.CustomControl.ColorPicker()
    picker.name = name
    picker.init_value = init_value
    picker.parent = str(parent)
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
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def remove_all_custom_controls(
    self: PointCloudViewer
) -> None:
    """すべてのカスタムコントロールを削除する。
    """
    remove_custom_control_cmd = server_pb2.RemoveCustomControl()
    remove_custom_control_cmd.all = True

    obj = server_pb2.ServerCommand()
    obj.remove_custom_control.CopyFrom(remove_custom_control_cmd)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def remove_custom_control(
    self: PointCloudViewer,
    uuid: UUID
) -> None:
    """指定したUUIDを持つカスタムコントロールを削除する。

    Args:
        uuid (UUID): 削除するコントロールに対応するID
    """
    remove_custom_control_cmd = server_pb2.RemoveCustomControl()
    remove_custom_control_cmd.by_uuid = str(uuid)

    obj = server_pb2.ServerCommand()
    obj.remove_custom_control.CopyFrom(remove_custom_control_cmd)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def add_custom_folder(
    self: PointCloudViewer,
    name: str = "folder",
    parent: UUID = UUID(int=0),
) -> UUID:
    """カスタムフォルダーにフォルダーを追加する。

    :param name: 表示名
    :type name: str, optional
    :param parent: 親フォルダーのUUID。特に指定しない場合はルートフォルダーになる。
    :type parent: UUID, optional

    Returns:
        UUID: コントロールに対応するID。後から操作する際に使う
    """
    folder = server_pb2.CustomControl.Folder()
    folder.name = name
    folder.parent = str(parent)
    add_custom_control = server_pb2.CustomControl()
    add_custom_control.folder.CopyFrom(folder)
    obj = server_pb2.ServerCommand()
    obj.add_custom_control.CopyFrom(add_custom_control)
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)
