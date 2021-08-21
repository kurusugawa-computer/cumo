from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from uuid import UUID, uuid4
import numpy
from pypcd import pypcd
from pointcloud_viewer._internal.protobuf import server_pb2
from typing import Optional


def send_pointcloud_pcd(
    self: PointCloudViewer,
    pcd_bytes: bytes,
) -> UUID:
    """点群をブラウザに送信し、表示させる。

    Args:
        pcd_bytes (bytes): pcd形式のデータ。

    Returns:
        UUID: 表示した点群に対応するID。後から操作する際に使う
    """
    cloud = server_pb2.AddObject.PointCloud()
    cloud.pcd_data = pcd_bytes

    add_obj = server_pb2.AddObject()
    add_obj.point_cloud.CopyFrom(cloud)

    obj = server_pb2.ServerCommand()
    obj.add_object.CopyFrom(add_obj)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def send_pointcloud(
    self: PointCloudViewer,
    xyz: Optional[numpy.ndarray] = None,
    rgb: Optional[numpy.ndarray] = None,
    xyzrgb: Optional[numpy.ndarray] = None
) -> UUID:
    """点群をブラウザに送信し、表示させる。

    Args:
        xyz (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が float32 の ndarray 。各行が点のx,y,z座標を表す。
        rgb (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が uint8 の ndarray 。各行が点のr,g,bを表す。
        xyzrgb (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が float32 の ndarray 。
            各行が点のx,y,z座標とrgbを表す。rgbは24ビットのrgb値を r<<16 + g<<8 + b のように float32 にエンコードしたもの。

    Returns:
        UUID: 表示した点群に対応するID。後から操作する際に使う
    """
    # 引数チェック
    if xyz is None and xyzrgb is None:
        raise ValueError("xyz or xyzrgb is required")
    if xyz is not None and not(len(xyz.shape) == 2 and xyz.shape[1] == 3 and xyz.dtype == "float32"):
        raise ValueError(
            "xyz must be float32 array of shape (num_points, 3)"
        )
    if rgb is not None:
        if xyz is None:
            raise ValueError("xyz is required with rgb")
        shape_is_valid = len(rgb.shape) == 2 and rgb.shape[1] == 3
        length_is_same = shape_is_valid and rgb.shape[0] == xyz.shape[0]
        type_is_valid = rgb.dtype == "uint8"

        if not (shape_is_valid and length_is_same and type_is_valid):
            raise ValueError(
                "rgb must be uint8 array of shape (num_points, 3)"
            )
    if xyzrgb is not None and not(len(xyzrgb.shape) == 2 and xyzrgb.shape[1] == 4 and xyzrgb.dtype == "float32"):
        raise ValueError(
            "xyzrgb must be float32 array of shape (num_points, 4)"
        )

    # pcdデータ作成
    pcd: pypcd.PointCloud
    if xyz is not None:
        if rgb is not None:
            rgb_u32 = rgb.astype("uint32")
            rgb_f32: numpy.ndarray = (
                (rgb_u32[:, 0] << 16)
                + (rgb_u32[:, 1] << 8)
                + rgb_u32[:, 2]
            )
            rgb_f32.dtype = "float32"

            concatenated: numpy.ndarray = numpy.column_stack((
                xyz,
                rgb_f32,
            ))
            pcd = pypcd.make_xyz_rgb_point_cloud(concatenated)
        else:
            pcd = pypcd.make_xyz_point_cloud(xyz)
    else:
        assert xyzrgb is not None
        pcd = pypcd.make_xyz_rgb_point_cloud(xyzrgb)

    pcd_bytes = pcd.save_pcd_to_buffer()

    # 送信
    return self.send_pointcloud_pcd(pcd_bytes)


def send_lineset(
    self: PointCloudViewer,
    xyz: numpy.ndarray,
    from_to: numpy.ndarray,
) -> UUID:
    """Linesetをブラウザに送信し、表示させる。

    Args:
        xyz (numpy.ndarray): shape が (num_points,3) で dtype が float32 の ndarray 。各行が線分の端点のx,y,z座標を表す。
        from_to (numpy.ndarray): shape が (num_lines,2) で dtype が uint64 の ndarray 。各行が線分の端点のインデックスによって1本の線分を表す。

    Returns:
        UUID: 表示したLinesetに対応するID。後から操作する際に使う
    """
    if not (len(xyz.shape) == 2 and xyz.shape[1] == 3 and xyz.dtype == "float32"):
        raise ValueError("xyz must be float32 array of shape (num_points,3)")
    if not (len(from_to.shape) == 2 and from_to.shape[1] == 2 and from_to.dtype == "uint64"):
        raise ValueError("from_to must be uint64 array of shape (num_lines,2)")

    num_points = xyz.shape[0]

    pb_lineset = server_pb2.AddObject.LineSet()
    for v in xyz:
        p = server_pb2.VecXYZf()
        p.x = v[0]
        p.y = v[1]
        p.z = v[2]
        pb_lineset.points.append(p)
    for l in from_to:
        if not (0 <= l[0] and l[0] < num_points and 0 <= l[1] and l[1] < num_points):
            raise ValueError(
                "value of from_to element must be 0 <= and < num_points")
        pb_lineset.from_index.append(l[0])
        pb_lineset.to_index.append(l[1])

    add_obj = server_pb2.AddObject()
    add_obj.line_set.CopyFrom(pb_lineset)
    obj = server_pb2.ServerCommand()
    obj.add_object.CopyFrom(add_obj)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def send_mesh(
    self: PointCloudViewer,
    xyz: numpy.ndarray,
    indices: numpy.ndarray,
    rgb: Optional[numpy.ndarray] = None
) -> UUID:
    """Meshをブラウザに送信し、表示させる。

    Args:
        xyz (numpy.ndarray): shape が (num_points,3) で dtype が float32 の ndarray 。各行が頂点のx,y,z座標を表す。
        indices (numpy.ndarray): shape が (num_triangles,3) で dtype が uint64 の ndarray 。各行が頂点のインデックスによって1枚の三角形を表す。
        rgb (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が float32 の ndarray 。各行が頂点のr,g,bを0から1までの数値で表す。

    Returns:
        UUID: 表示したMeshに対応するID。後から操作する際に使う
    """
    if not (len(xyz.shape) == 2 and xyz.shape[1] == 3 and xyz.dtype == "float32"):
        raise ValueError("xyz must be float32 array of shape (num_points,3)")
    if not (len(indices.shape) == 2 and indices.shape[1] == 3 and indices.dtype == "uint64"):
        raise ValueError(
            "indices must be uint64 array of shape (num_triangles,3)"
        )
    if rgb is not None:
        shape_is_valid = len(rgb.shape) == 2 and rgb.shape[1] == 3
        type_is_valid = rgb.dtype == "float32"

        if not (shape_is_valid and type_is_valid):
            raise ValueError(
                "rgb must be uint8 array of shape (num_triangles, 3)"
            )

    num_points = xyz.shape[0]

    pb_mesh = server_pb2.AddObject.Mesh()
    for v in xyz:
        p = server_pb2.VecXYZf()
        p.x = v[0]
        p.y = v[1]
        p.z = v[2]
        pb_mesh.points.append(p)
    for l in indices:
        for i in range(3):
            if not (0 <= l[i] and l[i] < num_points):
                raise ValueError(
                    "value of indices element must be 0 <= and < num_points")
        pb_mesh.vertex_a_index.append(l[0])
        pb_mesh.vertex_b_index.append(l[1])
        pb_mesh.vertex_c_index.append(l[2])
    if rgb is not None:
        for l in rgb:
            c = server_pb2.VecRGBf()
            c.r = l[0]
            c.g = l[1]
            c.b = l[2]
            pb_mesh.colors.append(c)
    add_obj = server_pb2.AddObject()
    add_obj.mesh.CopyFrom(pb_mesh)
    obj = server_pb2.ServerCommand()
    obj.add_object.CopyFrom(add_obj)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def send_overlay_text(
    self: PointCloudViewer,
    text: str,
    x: float = 0,
    y: float = 0,
    z: float = 0,
) -> UUID:
    """特定の座標を左上として文字列をオーバーレイさせる。

    :param text: 表示させる文字列
    :type text: str
    :param x: オーバーレイが追従する点のx座標
    :type x: float, optional
    :param y: オーバーレイが追従する点のy座標
    :type y: float, optional
    :param z: オーバーレイが追従する点のz座標
    :type z: float, optional

    Returns:
        UUID: オーバーレイに対応するID。後から操作する際に使う
    """
    overlay = server_pb2.AddObject.Overlay()
    position = server_pb2.VecXYZf()
    position.x = x
    position.y = y
    position.z = z
    overlay.position.CopyFrom(position)
    overlay.text = text
    add_obj = server_pb2.AddObject()
    add_obj.overlay.CopyFrom(overlay)
    obj = server_pb2.ServerCommand()
    obj.add_object.CopyFrom(add_obj)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)


def send_overlay_image(
    self: PointCloudViewer,
    data: bytes,
    width: int,
    x: float = 0,
    y: float = 0,
    z: float = 0,
) -> UUID:
    """特定の座標を左上として画像をオーバーレイさせる。

    Args:
        data (bytes): 画像データ。jpg,pngに対応
        width (int): オーバーレイの幅をピクセルで指定
        x (float, optional): オーバーレイが追従する点のx座標
        y (float, optional): オーバーレイが追従する点のy座標
        z (float, optional): オーバーレイが追従する点のz座標

    Returns:
        UUID: オーバーレイに対応するID。後から操作する際に使う
    """
    overlay = server_pb2.AddObject.Overlay()

    position = server_pb2.VecXYZf()
    position.x = x
    position.y = y
    position.z = z
    overlay.position.CopyFrom(position)

    image = server_pb2.AddObject.Overlay.Image()
    image.data = data
    image.width = width
    overlay.image.CopyFrom(image)

    add_obj = server_pb2.AddObject()
    add_obj.overlay.CopyFrom(overlay)
    obj = server_pb2.ServerCommand()
    obj.add_object.CopyFrom(add_obj)

    uuid = uuid4()
    self._send_data(obj, uuid)
    ret = self._wait_until(uuid)
    if ret.result.HasField("failure"):
        raise RuntimeError(ret.result.failure)
    if not ret.result.HasField("success"):
        raise RuntimeError("unexpected response")
    return UUID(hex=ret.result.success)
