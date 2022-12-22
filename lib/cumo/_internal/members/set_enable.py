from __future__ import annotations  # Postponed Evaluation of Annotations

from typing import TYPE_CHECKING
from uuid import uuid4

from cumo._internal.protobuf import server_pb2

if TYPE_CHECKING:
    from cumo import PointCloudViewer


def stop_render(self: PointCloudViewer):
    """クライアントの描画を停止させる。また、カメラコントロールも無効化される。
    """
    obj = server_pb2.ServerCommand()
    obj.set_enable = False

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)


def resume_render(self: PointCloudViewer):
    """クライアントの描画を再開させる。カメラもマウスによって操作できるようになる。
    """
    obj = server_pb2.ServerCommand()
    obj.set_enable = True

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
