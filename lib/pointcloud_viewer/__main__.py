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
    viewer.wait_connection()
    viewer.send_pointcloud(points)

    while True:
        str = getline()
        viewer.console_log(str)


def getline(prompt=""):
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    new = termios.tcgetattr(fd)
    new[3] = new[3] & ~termios.ICANON
    try:
        termios.tcsetattr(fd, termios.TCSADRAIN, new)
        line = input(prompt)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)
    return line


main()
