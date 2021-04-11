import asyncio
import time
from urllib import parse
import numpy

import open3d as open3d
from . import PointCloudViewer
import sys
import termios
from pypcd import pypcd
from argparse import ArgumentParser


def main():
    host = "127.0.0.1"
    websocket_port = 8081
    http_port = 8082

    parser = ArgumentParser()
    parser.add_argument("pcd_filepath")
    args = parser.parse_args()

    # points = pypcd.point_cloud_from_path(args.pcd_filepath)
    o3d_pc = open3d.io.read_point_cloud(args.pcd_filepath)
    n = 65536
    o3d_pc = o3d_pc.uniform_down_sample(
        (len(o3d_pc.points) + n - 1)//n
    )
    # xyz = numpy.asarray(o3d_pc.points)
    # x = xyz[:, 0] - xyz[:, 0].mean()
    # y = xyz[:, 1] - xyz[:, 1].mean()
    # z = xyz[:, 2] - xyz[:, 2].mean()
    # xyz = numpy.column_stack((x, y, z))
    # o3d_pc.points = open3d.utility.Vector3dVector(xyz)

    open3d.io.write_point_cloud("test.pcd", o3d_pc)

    viewer = PointCloudViewer(
        host=host, websocket_port=websocket_port, http_port=http_port
    )
    viewer.start()
    print("open: http://{}:{}".format(host, http_port))

    viewer.send_pointcloud_from_open3d(o3d_pc, on_success=lambda s: print(
        "pointcloud send"), on_failure=lambda e: print("error: "+e))

    while True:
        import time
        time.sleep(5)
        viewer.capture_screen(
            on_success=save_png,
            on_failure=lambda e: print("error: "+e)
        )


def save_png(data: bytes) -> None:
    f = open("image.png", "bw")
    f.write(data)
    f.close()
    print("saved")


main()
