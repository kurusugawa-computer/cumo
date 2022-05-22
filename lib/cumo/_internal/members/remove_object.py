from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
from uuid import UUID, uuid4
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer


# pylint: disable=no-member

def remove_all_objects(
    self: PointCloudViewer
) -> None:
    """すべてのオブジェクトとオーバーレイを削除する。
    """
    remove_object_cmd = server_pb2.RemoveObject()
    remove_object_cmd.all = True

    obj = server_pb2.ServerCommand()
    obj.remove_object.CopyFrom(remove_object_cmd)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def remove_object(
    self: PointCloudViewer,
    uuid: UUID
) -> None:
    """指定したUUIDを持つオブジェクトやオーバーレイを削除する。

    Args:
        uuid (UUID): オブジェクトやオーバーレイのUUID
    """
    remove_object_cmd = server_pb2.RemoveObject()
    remove_object_cmd.by_uuid = str(uuid)

    obj = server_pb2.ServerCommand()
    obj.remove_object.CopyFrom(remove_object_cmd)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
