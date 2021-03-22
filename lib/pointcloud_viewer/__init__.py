from pypcd.pypcd import PointCloud
from websocket_server import WebsocketServer
import threading
from .protobuf import server_pb2
import base64
import open3d
import time
from pypcd import pypcd
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
import pkgutil
from os.path import join


class _PointCloudViewerHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.redirect("index.html")
        else:
            path = join("/public/", "./"+self.path)
            print(path)
            data = pkgutil.get_data("pointcloud_viewer", path)
            if data != None:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_error(404)

    def log_message(self, format: str, *args) -> None:
        pass

    def redirect(self, path: str):
        self.send_response(301)
        url = urlparse(self.path)
        location = path
        print(location)
        self.send_header(
            "Location", location
        )
        self.end_headers()


class PointCloudViewer:
    websocket_server: WebsocketServer
    http_server: HTTPServer
    threads: list

    def __init__(self, host: str = "127.0.0.1", websocket_port: int = 8081, http_port: int = 8082) -> None:
        self.websocket_server = WebsocketServer(websocket_port, host)
        self.http_server = HTTPServer(
            (host, http_port), _PointCloudViewerHTTPRequestHandler
        )
        self.threads = [
            threading.Thread(
                target=lambda: self.websocket_server.run_forever()
            ),
            threading.Thread(
                target=lambda: self.http_server.serve_forever()
            )
        ]

    def __send_data(self, pbobj: server_pb2.PBServerCommand) -> None:
        data = base64.b64encode(pbobj.SerializeToString())
        self.websocket_server.send_message_to_all(data.decode())

    def wait_connection(self) -> None:
        while len(self.websocket_server.clients) < 1:
            time.sleep(0.1)

    def start(self) -> None:
        for thread in self.threads:
            thread: threading.Thread = thread
            thread.setDaemon(True)
            thread.start()

    def console_log(self, message: str) -> None:
        obj = server_pb2.PBServerCommand()
        obj.log_message = message
        self.__send_data(obj)

    def send_pointcloud(self, pc: pypcd.PointCloud) -> None:
        pcd = pc.save_pcd_to_buffer()
        print(pc.get_metadata())
        obj = server_pb2.PBServerCommand()
        obj.point_cloud.data = pcd
        self.__send_data(obj)
