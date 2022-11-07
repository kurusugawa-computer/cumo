from __future__ import annotations  # Postponed Evaluation of Annotations
import io
from typing import TYPE_CHECKING, Optional, Tuple
from uuid import UUID, uuid4
import html
import numpy
from PIL import Image
from numpy import ndarray
from cumo._vendor.pypcd import pypcd
# from pypcd import pypcd
from cumo.pointcloudviewer import DownSampleStrategy
from cumo._internal.protobuf import server_pb2
from cumo._internal.down_sample import down_sample_pointcloud

if TYPE_CHECKING:
    from cumo import PointCloudViewer

DOWNSAMPLING_DEFAULT_MAX_NUM_POINTS = 1_000_000

# pylint: disable=no-member


def send_pointcloud_pcd(
    self: PointCloudViewer,
    pcd_bytes: bytes,
    down_sample: DownSampleStrategy = DownSampleStrategy.RANDOM_SAMPLE,
    max_num_points: int = DOWNSAMPLING_DEFAULT_MAX_NUM_POINTS,
    point_size: float = 1
) -> UUID:
    """点群をブラウザに送信し、表示させる。

    Args:
        pcd_bytes (bytes): pcd形式のデータ。
        down_sample (DownSampleStrategy, optional): DownSampleStrategy.NONE以外を指定すると一定以上の大きさの点群をダウンサンプルする。
            DownSampleStrategy.NONEを指定すると渡されたデータをそのまま送信する。
        max_num_points (int, optional): ダウンサンプルを行う場合、点数をこの数字以下に削減する。
        point_size (int, optional): 点のサイズ。
    Returns:
        UUID: 表示した点群に対応するID。後から操作する際に使う
    """

    if down_sample == DownSampleStrategy.NONE:
        cloud = server_pb2.AddObject.PointCloud()
        cloud.pcd_data = pcd_bytes
        cloud.point_size = point_size

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

    pypcd_pc = pypcd.point_cloud_from_buffer(pcd_bytes)
    pc_data: numpy.ndarray = pypcd_pc.pc_data

    xyz = numpy.stack([pc_data["x"], pc_data["y"], pc_data["z"]], axis=1)

    rgb_u32: numpy.ndarray = pc_data["rgb"]
    rgb_u32.dtype = "uint32"
    r_u8: numpy.ndarray = ((rgb_u32 & 0xff0000) >> 16).astype("uint8")
    g_u8: numpy.ndarray = ((rgb_u32 & 0x00ff00) >> 8).astype("uint8")
    b_u8: numpy.ndarray = (rgb_u32 & 0x0000ff).astype("uint8")

    rgb = numpy.stack([r_u8, g_u8, b_u8], axis=1)

    return self.send_pointcloud(
        xyz=xyz, rgb=rgb, down_sample=down_sample, max_num_points=max_num_points, point_size=point_size)


def send_pointcloud(
    self: PointCloudViewer,
    xyz: Optional[numpy.ndarray] = None,
    rgb: Optional[numpy.ndarray] = None,
    xyzrgb: Optional[numpy.ndarray] = None,
    down_sample: Optional[DownSampleStrategy] = DownSampleStrategy.RANDOM_SAMPLE,
    max_num_points: int = DOWNSAMPLING_DEFAULT_MAX_NUM_POINTS,
    point_size: float = 1
) -> UUID:
    """点群をブラウザに送信し、表示させる。

    Args:
        xyz (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が float32 の ndarray 。各行が点のx,y,z座標を表す。
        rgb (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が uint8 の ndarray 。各行が点のr,g,bを表す。
        xyzrgb (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が float32 の ndarray 。
            各行が点のx,y,z座標とrgbを表す。rgbは24ビットのrgb値を r<<16 + g<<8 + b のように float32 にエンコードしたもの。
        down_sample (DownSampleStrategy, optional): DownSampleStrategy.NONE以外を指定すると一定以上の大きさの点群をダウンサンプルする。
        max_num_points (int, optional): ダウンサンプルを行う場合、点数をこの数字以下に削減する。
        point_size (int, optional): 点のサイズ。

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
            pcd = pypcd.make_xyz_rgb_point_cloud(
                down_sample_pointcloud(
                    concatenated, down_sample, max_num_points=max_num_points)
            )
        else:
            pcd = pypcd.make_xyz_point_cloud(
                down_sample_pointcloud(
                    xyz, down_sample, max_num_points=max_num_points)
            )
    else:
        assert xyzrgb is not None
        pcd = pypcd.make_xyz_rgb_point_cloud(
            down_sample_pointcloud(xyzrgb, down_sample,
                                   max_num_points=max_num_points)
        )

    pcd_bytes = pcd.save_pcd_to_buffer()

    # 送信
    return self.send_pointcloud_pcd(pcd_bytes, down_sample=DownSampleStrategy.NONE, point_size=point_size)


# pylint: disable=too-many-branches
def send_lineset(
    self: PointCloudViewer,
    xyz: numpy.ndarray,
    from_to: numpy.ndarray,
    rgb: Optional[numpy.ndarray] = None,
    width: Optional[numpy.ndarray] = None
) -> UUID:
    """Linesetをブラウザに送信し、表示させる。

    Args:
        xyz (numpy.ndarray): shape が (num_points,3) で dtype が float32 の ndarray 。各行が線分の端点のx,y,z座標を表す。
        from_to (numpy.ndarray): shape が (num_lines,2) で dtype が uint32 の ndarray 。各行が線分の端点のインデックスによって1本の線分を表す。
        rgb (Optional[numpy.ndarray], optional): shape が (num_lines,3) で dtype が uint8 の ndarray 。各行が線分のr,g,bを表す。
        width (Optional[numpy.ndarray], optional): shape が (num_lines,) で dtypeが float32 の ndarray 。各要素が線分の太さを表す。
    Returns:
        UUID: 表示したLinesetに対応するID。後から操作する際に使う
    """
    if not (len(xyz.shape) == 2 and xyz.shape[1] == 3 and xyz.dtype == "float32"):
        raise ValueError("xyz must be float32 array of shape (num_points,3)")
    if not (len(from_to.shape) == 2 and from_to.shape[1] == 2 and from_to.dtype == "uint32"):
        raise ValueError("from_to must be uint32 array of shape (num_lines,2)")

    if rgb is not None:
        shape_is_valid = len(rgb.shape) == 2 and rgb.shape[1] == 3
        type_is_valid = rgb.dtype == "uint8"

        if not (shape_is_valid and type_is_valid):
            raise ValueError(
                "rgb must be uint8 array of shape (num_lines, 3)"
            )
    if width is not None:
        shape_is_valid = len(width.shape) == 1
        if rgb is not None:
            shape_is_valid = shape_is_valid and rgb.shape[0] == width.shape[0]
        type_is_valid = width.dtype == "float32"

        if not (shape_is_valid and type_is_valid):
            raise ValueError(
                "whidth must be float32 array of shape (num_lines,)"
            )

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

    if rgb is not None:
        for l in rgb:
            c = server_pb2.VecRGBf()
            c.r = l[0]
            c.g = l[1]
            c.b = l[2]
            pb_lineset.colors.append(c)
    if width is not None:
        for w in width:
            pb_lineset.widths.append(w)
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
        indices (numpy.ndarray): shape が (num_triangles,3) で dtype が uint32 の ndarray 。各行が頂点のインデックスによって1枚の三角形を表す。
        rgb (Optional[numpy.ndarray], optional): shape が (num_points,3) で dtype が uint8 の ndarray 。各行が頂点のr,g,bを表す。

    Returns:
        UUID: 表示したMeshに対応するID。後から操作する際に使う
    """
    if not (len(xyz.shape) == 2 and xyz.shape[1] == 3 and xyz.dtype == "float32"):
        raise ValueError("xyz must be float32 array of shape (num_points,3)")
    if not (len(indices.shape) == 2 and indices.shape[1] == 3 and indices.dtype == "uint32"):
        raise ValueError(
            "indices must be uint32 array of shape (num_triangles,3)"
        )
    if rgb is not None:
        shape_is_valid = len(rgb.shape) == 2 and rgb.shape[1] == 3
        type_is_valid = rgb.dtype == "uint8"

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
        rgb_f = rgb.astype("float32")
        rgb_f /= 255
        for l in rgb_f:
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
    screen_coordinate: bool = False,
    style: str = "",
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
    :param screen_coordinate: Trueにするとオーバーレイが画面の指定の位置に固定される。このときzは無視される
    :type screen_coordinate: bool, optional
    :param style: style属性に渡される文字列
    :type style: str, optional

    Returns:
        UUID: オーバーレイに対応するID。後から操作する際に使う
    """
    overlay = server_pb2.AddObject.Overlay()
    position = server_pb2.VecXYZf()
    position.x = x
    position.y = y
    position.z = z
    overlay.position.CopyFrom(position)

    inner_html = html.escape(text).replace("\n", "<br />\n")
    attributes = f"style=\"color:white;mix-blend-mode:difference;{style}\""
    overlay.html = f"<div {attributes}>{inner_html}</div>"

    if screen_coordinate:
        overlay.type = server_pb2.AddObject.Overlay.CoordinateType.SCREEN_COORDINATE
    else:
        overlay.type = server_pb2.AddObject.Overlay.CoordinateType.WORLD_COORDINATE
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


def send_overlay_image_from_ndarray(
    self: PointCloudViewer,
    ndarray_data: ndarray,
    width: int,
    x: float = 0,
    y: float = 0,
    z: float = 0,
    screen_coordinate: bool = False,
) -> UUID:
    """特定の座標を左上として画像をオーバーレイさせる。

    Args:
        ndarray_data (ndarray): shape が (height,width,3) で dtype が uint8 の ndarray。非圧縮の画像データ。
        width (int): オーバーレイの幅をピクセルで指定
        x (float, optional): オーバーレイが追従する点のx座標
        y (float, optional): オーバーレイが追従する点のy座標
        z (float, optional): オーバーレイが追従する点のz座標
        screen_coordinate (bool, optional) Trueにするとオーバーレイが画面の指定の位置に固定される。このときzは無視される

    Returns:
        UUID: オーバーレイに対応するID。後から操作する際に使う
    """
    if not(len(ndarray_data.shape) == 3 and ndarray_data.shape[2] == 3 and ndarray_data.dtype == "uint8"):
        raise ValueError("ndarray_data must be uint8 array of shape (height, width, 3)")
    img = Image.fromarray(ndarray_data)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    return self.send_overlay_image(
        img_bytes.getvalue(),
        width,
        x,
        y,
        z,
        screen_coordinate
    )


def send_overlay_image(
    self: PointCloudViewer,
    data: bytes,
    width: int,
    x: float = 0,
    y: float = 0,
    z: float = 0,
    screen_coordinate: bool = False,
) -> UUID:
    """特定の座標を左上として画像をオーバーレイさせる。

    Args:
        data (bytes): 画像データ。jpg,pngに対応
        width (int): オーバーレイの幅をピクセルで指定
        x (float, optional): オーバーレイが追従する点のx座標
        y (float, optional): オーバーレイが追従する点のy座標
        z (float, optional): オーバーレイが追従する点のz座標
        screen_coordinate (bool, optional) Trueにするとオーバーレイが画面の指定の位置に固定される。このときzは無視される

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

    if screen_coordinate:
        overlay.type = server_pb2.AddObject.Overlay.CoordinateType.SCREEN_COORDINATE
    else:
        overlay.type = server_pb2.AddObject.Overlay.CoordinateType.WORLD_COORDINATE

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


def send_image(
    self: PointCloudViewer,
    data: bytes,
    upper_left: Tuple[float, float, float],
    lower_left: Tuple[float, float, float],
    lower_right: Tuple[float, float, float],
    double_side: bool = False,
) -> UUID:
    """画像を平面に貼り付けたものをブラウザに送信し、表示する。

    Args:
        data (bytes): 画像データ。jpg,pngに対応
        upper_left (Tuple[float, float, float]): 画像の左上の座標
        lower_left (Tuple[float, float, float]): 画像の左下の座標
        lower_right (Tuple[float, float, float]): 画像の右下の座標
        double_side (bool, optional): Trueにすると裏から見たときに描画される

    Returns:
        UUID: UUID: 画像に対応するID。後から操作する際に使う
    """
    if not (
        isinstance(upper_left, tuple)
        and len(upper_left) == 3
        and all(isinstance(m, (int, float)) for m in upper_left)
    ):
        raise ValueError("upper_left must be tuple of type (x: float, y: float, z: float)")
    if not (
            isinstance(lower_left, tuple)
            and len(lower_left) == 3
            and all(isinstance(m, (int, float)) for m in lower_left)
    ):
        raise ValueError("lower_left must be tuple of type (x: float, y: float, z: float)")
    if not (
        isinstance(lower_right, tuple)
        and len(lower_right) == 3
        and all(isinstance(m, (int, float)) for m in lower_right)
    ):
        raise ValueError("lower_right must be tuple of type (x: float, y: float, z: float)")
    if not isinstance(double_side, bool):
        raise ValueError("double_side must be bool")

    image = server_pb2.AddObject.Image()
    image.data = data

    pos = server_pb2.VecXYZf()
    pos.x = upper_left[0]
    pos.y = upper_left[1]
    pos.z = upper_left[2]
    image.upper_left.CopyFrom(pos)
    pos.x = lower_left[0]
    pos.y = lower_left[1]
    pos.z = lower_left[2]
    image.lower_left.CopyFrom(pos)
    if lower_right is not None:
        pos.x = lower_right[0]
        pos.y = lower_right[1]
        pos.z = lower_right[2]
        image.lower_right.CopyFrom(pos)
    image.double_side = double_side

    add_obj = server_pb2.AddObject()
    add_obj.image.CopyFrom(image)
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
