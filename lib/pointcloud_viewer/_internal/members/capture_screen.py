from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from uuid import uuid4
from pointcloud_viewer._internal.protobuf import server_pb2


def capture_screen(
    self: PointCloudViewer,
) -> bytes:
    """ブラウザのcanvasに表示されている画像をpng形式で保存させる。
    """
    obj = server_pb2.ServerCommand()
    obj.capture_screen = True
    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if ret.HasField("image"):
        return ret.image.data
