import numpy
import open3d as open3d

from argparse import ArgumentParser
import sys

from .pointcloud_viewer import PointCloudViewer


def main():
    host = "127.0.0.1"
    websocket_port = 8081
    http_port = 8082

    parser = ArgumentParser()
    parser.add_argument("pcd_filepath")
    args = parser.parse_args()

    o3d_pc = open3d.io.read_point_cloud(args.pcd_filepath)
    n = 65536
    o3d_pc = o3d_pc.uniform_down_sample(
        (len(o3d_pc.points) + n - 1)//n
    )
    xyz = numpy.asarray(o3d_pc.points)
    xyz[:, 0] -= xyz[:, 0].mean()
    xyz[:, 1] -= xyz[:, 1].mean()
    xyz[:, 2] -= xyz[:, 2].mean()
    o3d_pc.points = open3d.utility.Vector3dVector(xyz)

    radius = numpy.amax(xyz[:, 0]**2 + xyz[:, 1]**2 + xyz[:, 2]**2)**0.5

    viewer = PointCloudViewer(
        host=host, websocket_port=websocket_port, http_port=http_port, autostart=True
    )
    print("open: http://{}:{}".format(host, http_port))
    print("setup...")

    def save_png(name: str, data: bytes, index: int) -> None:
        f = open(name, "bw")
        f.write(data)
        f.close()
        print("saved: "+name)
        loop(index)

    commands = [
        lambda index:viewer.set_camera_position(
            1, 0, 0, on_success=loop(index+1)
        ),
        lambda index:viewer.capture_screen(
            on_success=lambda data: save_png("screenshot_x.png", data, index+1)
        ),
        lambda index: viewer.set_camera_position(
            0, 1, 0, on_success=loop(index+1)
        ),
        lambda index:viewer.capture_screen(
            on_success=lambda data: save_png("screenshot_y.png", data, index+1)
        ),
        lambda index: viewer.set_camera_position(
            0, 0, 1, on_success=loop(index+1)
        ),
        lambda index:viewer.capture_screen(
            on_success=lambda data: save_png("screenshot_z.png", data, index+1)
        ),
        lambda index: sys.exit()
    ]

    def loop(index: int) -> None:
        commands[index](index)

    viewer.send_pointcloud_from_open3d(o3d_pc)
    viewer.add_box(radius*2, radius*2,radius*2)
    viewer.set_orthographic_camera(frustum_height=radius*2)

    viewer.add_custom_button(
        name="start", on_changed=lambda v: loop(0),
        on_success=lambda s: print(
            "resize window and press custom control button \"start\""
        )
    )

    viewer.wait_forever()


if __name__ == "__main__":
    main()
