from __future__ import annotations  # Postponed Evaluation of Annotations
from io import BytesIO
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer
import numpy as np
from numpy import ndarray
from PIL import Image
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


def capture_screen_as_ndarray(
    self: PointCloudViewer,
) -> ndarray:
    """ブラウザのcanvasに表示されている画像をndarrayで返す\\
    形式は shape = (Height x Width x 3), dtype = uint8
    """
    data = self.capture_screen()
    img = Image.open(BytesIO(data)).convert("RGB")
    return np.array(img)