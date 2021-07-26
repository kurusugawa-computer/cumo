from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from uuid import uuid4
from pointcloud_viewer._internal.protobuf import server_pb2


def remove_all(
    self: PointCloudViewer
) -> None:
    """すべての点群とオーバーレイ、カスタムコントロールを削除する。
    """
    remove_object = server_pb2.RemoveObject()
    remove_object.all = True

    obj = server_pb2.ServerCommand()
    obj.remove_object.CopyFrom(remove_object)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
