from __future__ import annotations  # Postponed Evaluation of Annotations
from io import BytesIO
from typing import TYPE_CHECKING
from uuid import uuid4
from numpy import ndarray
import numpy as np
from PIL import Image
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer


# pylint: disable=no-member


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
    raise RuntimeError("Unreachable")


def capture_screen_as_ndarray(
    self: PointCloudViewer,
) -> ndarray:
    """ブラウザのcanvasに表示されている画像を、shape が (height,width,3) で dtype が uint8 の ndarray で返す。
    """
    data = self.capture_screen()
    img = Image.open(BytesIO(data)).convert("RGB")
    return np.array(img)
