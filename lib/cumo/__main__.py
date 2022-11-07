import sys
from uuid import UUID
from argparse import ArgumentParser
import numpy
from cumo import PointCloudViewer
from cumo.keyboard_event import KeyboardEvent


def main():
    host = "127.0.0.1"
    websocket_port = 8081
    http_port = 8082

    parser = ArgumentParser()
    parser.add_argument("pcd_filepath")
    args = parser.parse_args()

    viewer = PointCloudViewer(
        host=host, websocket_port=websocket_port, http_port=http_port, autostart=True
    )
    print(f"open: http://{host}:{http_port}")
    print("setup...")

    viewer.remove_all_objects()
    viewer.remove_all_custom_controls()

    radius = send_pointcloud_pcd(viewer, args.pcd_filepath)

    points = numpy.array([
        [0, 0, 0],
        [1, 0, 0], [0, 1, 0], [0, 0, 1],
        [1, 1, 0], [1, 0, 1], [0, 1, 1],
        [2, 0, 0], [0, 2, 0], [0, 0, 2]
    ])
    points = points * numpy.ones((3,))*0.1
    points = points.astype("float32")

    lines = numpy.array([
        [0, 7], [0, 8], [0, 9]
    ]).astype("uint32")
    colors = numpy.array([
        [255, 0, 0], [0, 255, 0], [0, 0, 255],
    ]).astype("uint8")
    widths = (numpy.ones((3,))*5.0).astype("float32")
    viewer.send_lineset(points, lines, colors, widths)

    viewer.send_overlay_text(
        "x", points[7][0], points[7][1], points[7][2], style="color: red"
    )
    viewer.send_overlay_text(
        "y", points[8][0], points[8][1], points[8][2], style="color: green"
    )
    viewer.send_overlay_text(
        "z", points[9][0], points[9][1], points[9][2], style="color: blue"
    )
    viewer.send_overlay_text(args.pcd_filepath, 10, 10,
                             screen_coordinate=True, style="font-family: monospace")

    triangles = numpy.array([
        [0, 1, 2], [0, 2, 3], [3, 1, 0]
    ]).astype("uint32")
    colors = numpy.array([
        [255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255]
    ]).astype("uint8")
    viewer.send_mesh(points, triangles, colors)

    viewer.set_orthographic_camera(frustum_height=radius*2)

    def save_png(name: str, data: bytes) -> None:
        with open(name, "bw") as f:
            f.write(data)
            f.close()
            print("saved: "+name)

    def take_screenshots():

        for p in [(1, 0, 0, "screenshot_x.png"), (0, 1, 0, "screenshot_y.png"), (0, 0, 1, "screenshot_z.png")]:
            viewer.set_camera_position(p[0], p[1], p[2])
            viewer.set_camera_roll(0, p[1], p[2], p[0])
            data = viewer.capture_screen()
            save_png(p[3], data)

    def on_keyup(ev: KeyboardEvent, handler_id: UUID):
        if ev.code == "KeyA":
            take_screenshots()
            viewer.remove_keyup_handler(handler_id)
            sys.exit(0)

    keyup_handler_id = viewer.add_keyup_handler(on_keyup)

    def on_start_button_pushed():
        take_screenshots()
        viewer.remove_keyup_handler(keyup_handler_id)
        sys.exit(0)

    viewer.add_custom_button(
        name="start", on_changed=lambda dummy: on_start_button_pushed()
    )

    print("resize window and press custom control button \"start\" (or press A key)")

    viewer.wait_forever()


def send_pointcloud_pcd(viewer: PointCloudViewer, filename: str) -> float:
    with open(filename, "rb") as f:
        b = f.read()
        viewer.send_pointcloud_pcd(b)
    return 1


if __name__ == "__main__":
    main()
