from uuid import UUID
import numpy
import open3d as open3d
from pypcd import pypcd

from argparse import ArgumentParser

from pointcloud_viewer.pointcloud_viewer import PointCloudViewer
from pointcloud_viewer.keyboard_event import KeyboardEvent


def main():
    host = "127.0.0.1"
    websocket_port = 8081
    http_port = 8082

    parser = ArgumentParser()
    parser.add_argument("pcd_filepath")
    args = parser.parse_args()

    pypcd_pc = pypcd.point_cloud_from_path(args.pcd_filepath)

    pc_data: numpy.ndarray = pypcd_pc.pc_data

    xyz = numpy.stack([pc_data["x"], pc_data["y"], pc_data["z"]], axis=1)

    xyz[:, 0] -= xyz[:, 0].mean()
    xyz[:, 1] -= xyz[:, 1].mean()
    xyz[:, 2] -= xyz[:, 2].mean()
    radius = numpy.amax(xyz[:, 0]**2 + xyz[:, 1]**2 + xyz[:, 2]**2)**0.5

    rgb_u32: numpy.ndarray = pc_data["rgb"]
    rgb_u32.dtype = "uint32"
    r_u8: numpy.ndarray = ((rgb_u32 & 0xff0000) >> 16).astype("uint8")
    g_u8: numpy.ndarray = ((rgb_u32 & 0x00ff00) >> 8).astype("uint8")
    b_u8: numpy.ndarray = (rgb_u32 & 0x0000ff).astype("uint8")

    rgb = numpy.stack([r_u8, g_u8, b_u8], axis=1)

    viewer = PointCloudViewer(
        host=host, websocket_port=websocket_port, http_port=http_port, autostart=True
    )
    print("open: http://{}:{}".format(host, http_port))
    print("setup...")

    viewer.remove_all_objects()
    viewer.remove_all_custom_controls()

    viewer.send_pointcloud(xyz=xyz, rgb=rgb)
    # or:
    #   import numpy.lib.recfunctions as rf
    #   viewer.send_pointcloud(xyzrgb=rf.structured_to_unstructured(pc_data))

    points = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1],
              [0, 1, 1], [1, 1, 1]]
    lines = [[0, 1], [0, 2], [1, 3], [2, 3], [4, 5], [4, 6], [5, 7], [6, 7],
             [0, 4], [1, 5], [2, 6], [3, 7]]
    line_set = open3d.geometry.LineSet()
    line_set.points = open3d.utility.Vector3dVector(points)
    line_set.lines = open3d.utility.Vector2iVector(lines)

    line_set.scale(radius*2, (0, 0, 0))
    line_set.translate((-radius, -radius, -radius))

    for point in line_set.points:
        text = "%.2f,%.2f,%.2f" % tuple(point)
        viewer.send_overlay_text(text, point[0], point[1], point[2])

    viewer.send_lineset_from_open3d(line_set)
    viewer.set_orthographic_camera(frustum_height=radius*2)

    def save_png(name: str, data: bytes) -> None:
        f = open(name, "bw")
        f.write(data)
        f.close()
        print("saved: "+name)

    def take_screenshots():
        for p in [(1, 0, 0, "screenshot_x.png"), (0, 1, 0, "screenshot_y.png"), (0, 0, 1, "screenshot_z.png")]:
            viewer.set_camera_position(p[0], p[1], p[2])
            data = viewer.capture_screen()
            save_png(p[3], data)

    def on_keyup(ev: KeyboardEvent, handler_id: UUID):
        if (ev.code == "KeyA"):
            take_screenshots()
            viewer.remove_keyup_handler(handler_id)
            exit(0)

    keyup_handler_id = viewer.add_keyup_handler(on_keyup)

    def on_start_button_pushed():
        take_screenshots()
        viewer.remove_keyup_handler(keyup_handler_id)
        exit(0)

    viewer.add_custom_button(
        name="start", on_changed=lambda dummy: on_start_button_pushed()
    )

    print("resize window and press custom control button \"start\" (or press A key)")

    viewer.wait_forever()


if __name__ == "__main__":
    main()
