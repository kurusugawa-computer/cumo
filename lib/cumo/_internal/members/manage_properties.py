from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING, Any, List
from uuid import uuid4
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer


# pylint: disable=no-member

def set_property(
    self: PointCloudViewer,
    target: List[str],
    value: Any,
) -> None:
    """プロパティを設定する。

    :param target: プロパティのパス。 ``["controls", "rotateSpeed"]`` のように指定する
    :type target: List[str]
    :param value: 設定する値。bool, int, float, strのいずれか
    :type value: Any
    """
    set_property_cmd = server_pb2.SetProperty()
    set_property_cmd.target.extend(target)
    if isinstance(value, bool):
        set_property_cmd.bool_value = value
    elif isinstance(value, int):
        set_property_cmd.int_value = value
    elif isinstance(value, float):
        set_property_cmd.float_value = value
    elif isinstance(value, str):
        set_property_cmd.string_value = value
    else:
        raise ValueError("unsupported type")

    # 送信処理
    obj = server_pb2.ServerCommand()
    obj.set_property.CopyFrom(set_property_cmd)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
