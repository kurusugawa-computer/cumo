from logging import handlers
from websocket_server import WebsocketServer
from pypcd import pypcd
import open3d

from .protobuf.server_pb2 import PBServerCommand
from .protobuf.client_pb2 import PBClientCommand

import threading
import base64
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
import pkgutil
from os.path import join
from uuid import UUID, uuid4
from typing import Callable, Optional, Union


class _PointCloudViewerHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.redirect("index.html")
        else:
            path = join("/public/", "./"+self.path)
            print(path)
            data: Union[bytes, None] = None
            try:
                data = pkgutil.get_data("pointcloud_viewer", path)
            except FileNotFoundError:
                self.send_error(404)
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
    on_success: dict
    on_failure: dict

    def __init__(self, host: str = "127.0.0.1", websocket_port: int = 8081, http_port: int = 8082) -> None:
        self.websocket_server = WebsocketServer(websocket_port, host)
        self.http_server = HTTPServer(
            (host, http_port), _PointCloudViewerHTTPRequestHandler
        )
        self.websocket_server.set_fn_message_received(self.__handle_message)
        self.threads = [
            threading.Thread(
                target=lambda: self.websocket_server.run_forever()
            ),
            threading.Thread(
                target=lambda: self.http_server.serve_forever()
            )
        ]
        self.on_success = dict()
        self.on_failure = dict()

    def __handle_message(self, client: dict, server: WebsocketServer, message: str):
        command: PBClientCommand = PBClientCommand()
        command.ParseFromString(base64.b64decode(message))
        if command.result.HasField("success"):
            self.__handle_success(command)
        elif command.result.HasField("failure"):
            self.__handle_failure(command)

    def __handle_success(self, command: PBClientCommand):
        uuid = UUID(bytes_le=command.result.UUID)
        if self.on_success[uuid] != None:
            print(self.on_success[uuid])
            self.on_success[uuid]()

    def __handle_failure(self, command: PBClientCommand):
        uuid = UUID(bytes_le=command.result.UUID)
        if self.on_failure[uuid] != None:
            print(self.on_failure[uuid])
            self.on_failure[uuid]()

    def __send_data(self, pbobj: PBServerCommand, uuid: UUID) -> None:
        pbobj.UUID = uuid.bytes_le
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

    def console_log(
        self,
        message: str,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = PBServerCommand()
        obj.log_message = message
        uuid = uuid4()
        self.on_success[uuid] = on_success
        self.on_failure[uuid] = on_failure
        self.__send_data(obj, uuid)

    def send_pointcloud(
        self,
        pc: pypcd.PointCloud,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        pcd = pc.save_pcd_to_buffer()
        print(pc.get_metadata())
        obj = PBServerCommand()
        obj.point_cloud.data = pcd
        uuid = uuid4()
        self.on_success[uuid] = on_success
        self.on_failure[uuid] = on_failure
        self.__send_data(obj, uuid)
