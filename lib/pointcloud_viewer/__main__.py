import asyncio
import time
from urllib import parse
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

    points = pypcd.point_cloud_from_path(args.pcd_filepath)

    viewer = PointCloudViewer(
        host=host, websocket_port=websocket_port, http_port=http_port
    )
    viewer.start()
    print("open: http://{}:{}".format(host, http_port))

    viewer.send_pointcloud(points, on_success=lambda s: print(
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
