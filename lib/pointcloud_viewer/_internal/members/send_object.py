from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from pointcloud_viewer.pointcloud_viewer import PointCloudViewer

from uuid import UUID, uuid4
import numpy
from pypcd import pypcd
import open3d
from pointcloud_viewer._internal.protobuf import server_pb2


def send_pointcloud_from_open3d(
    self: PointCloudViewer,
    pc: open3d.geometry.PointCloud,
) -> UUID:
    """点群をブラウザに送信し、表示させる。

    :param pc: 点群。色付きの場合は反映される
    :type pc: open3d.geometry.PointCloud
    """
    pcd: pypcd.PointCloud
    if len(pc.points) == len(pc.colors):
        colors_f32 = numpy.asarray(pc.colors)
        colors_f32 *= 255
        colors = colors_f32.astype(numpy.uint32)

        rgb = (colors[:, 0] << 16) | (colors[:, 1] << 8) | colors[:, 2]
        rgb.dtype = numpy.float32

        xyzrgb = numpy.column_stack((
            numpy.asarray(pc.points).astype(numpy.float32),
            rgb,
        ))
        pcd = pypcd.make_xyz_rgb_point_cloud(xyzrgb)
    else:
        xyz = numpy.asarray(pc.points).astype(numpy.float32)
        pcd = pypcd.make_xyz_point_cloud(xyz)
    pcd_bytes = pcd.save_pcd_to_buffer()

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


def send_lineset_from_open3d(
    self: PointCloudViewer,
    lineset: open3d.geometry.LineSet,
) -> UUID:
    """LineSetをブラウザに送信し、表示させる。

    :param lineset: LineSet。
    :type lineset: open3d.geometry.LineSet
    """
    pb_lineset = server_pb2.AddObject.LineSet()
    for v in numpy.asarray(lineset.points):
        p = server_pb2.VecXYZf()
        p.x = v[0]
        p.y = v[1]
        p.z = v[2]
        pb_lineset.points.append(p)
    for l in numpy.asarray(lineset.lines):
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
