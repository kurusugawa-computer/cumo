import asyncio
from logging import handlers
import sys
import numpy
from pypcd import pypcd
import open3d
from google.protobuf.message import DecodeError
import websockets

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
from queue import Queue


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
    websocket_connections: set
    broadcast_queue: Queue
    http_server: HTTPServer
    threads: list
    on_success: dict
    on_failure: dict

    def __init__(self, host: str = "127.0.0.1", websocket_port: int = 8081, http_port: int = 8082) -> None:
        self.websocket_connections = set()
        self.broadcast_queue = Queue()
        loop = asyncio.get_event_loop()
        loop.create_task(self.__broadcast())
        start_server = websockets.serve(self.__websocket_handler,
                                        host=host, port=websocket_port)
        loop.run_until_complete(start_server)

        self.http_server = HTTPServer(
            (host, http_port),
            _PointCloudViewerHTTPRequestHandler,
        )

        self.threads = [
            threading.Thread(
                target=lambda: loop.run_forever()
            ),
            threading.Thread(
                target=lambda: self.http_server.serve_forever()
            )
        ]
        self.on_success = dict()
        self.on_failure = dict()

    async def __websocket_handler(self, websocket: websockets.WebSocketServerProtocol, path: str):
        self.websocket_connections.add(websocket)
        try:
            async for msg in websocket:
                self.__handle_message(msg)
        finally:
            self.websocket_connections.remove(websocket)

    async def __broadcast(self):
        while True:
            if not self.broadcast_queue.empty() and 0 < len(self.websocket_connections):
                data = self.broadcast_queue.get()
                for conn in self.websocket_connections:
                    conn: websockets.WebSocketServerProtocol = conn
                    await conn.send(data)
            await asyncio.sleep(0.1)

    def __handle_message(self, message: bytes):
        command: PBClientCommand = PBClientCommand()
        try:
            command.ParseFromString(message)
        except DecodeError:
            print("error: failed to parsing message", file=sys.stderr)
            return
        except Exception as e:
            print("error: "+str(e), file=sys.stderr)
            return

        if command.HasField("result"):
            if command.result.HasField("success"):
                self.__handle_success(command)
            elif command.result.HasField("failure"):
                self.__handle_failure(command)
        elif command.HasField("image"):
            self.__handle_image(command)

    def __handle_image(self, command: PBClientCommand):
        uuid = UUID(bytes_le=command.image.UUID)
        if self.on_success[uuid] != None:
            self.on_success[uuid](command.image.data)

    def __handle_success(self, command: PBClientCommand):
        uuid = UUID(bytes_le=command.result.UUID)
        if self.on_success[uuid] != None:
            self.on_success[uuid](command.result.success)

    def __handle_failure(self, command: PBClientCommand):
        uuid = UUID(bytes_le=command.result.UUID)
        if self.on_failure[uuid] != None:
            self.on_failure[uuid](command.result.failure)

    def __send_data(self, pbobj: PBServerCommand, uuid: UUID) -> None:
        pbobj.UUID = uuid.bytes_le
        data = base64.b64encode(pbobj.SerializeToString())
        self.broadcast_queue.put(data.decode())

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

    def send_pointcloud_from_open3d(
        self,
        pc: open3d.geometry.PointCloud,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        pcd: pypcd.PointCloud
        print(len(pc.points))
        if len(pc.points) == len(pc.colors):
            colors_f32 = numpy.asarray(pc.colors)
            colors_f32 *= 256
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
        obj = PBServerCommand()
        obj.point_cloud.data = pcd_bytes
        uuid = uuid4()
        self.on_success[uuid] = on_success
        self.on_failure[uuid] = on_failure
        self.__send_data(obj, uuid)

    def capture_screen(
        self,
        on_success: Callable[[bytes], None],
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = PBServerCommand()
        obj.capture_screen = True
        uuid = uuid4()
        self.on_success[uuid] = on_success
        self.on_failure[uuid] = on_failure
        self.__send_data(obj, uuid)

    def switch_camera_to_orthographic(
        self,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = PBServerCommand()
        obj.use_perspective_camera = False
        uuid = uuid4()
        self.on_success[uuid] = on_success
        self.on_failure[uuid] = on_failure
        self.__send_data(obj, uuid)

    def switch_camera_to_perspective(
        self,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = PBServerCommand()
        obj.use_perspective_camera = True
        uuid = uuid4()
        self.on_success[uuid] = on_success
        self.on_failure[uuid] = on_failure
        self.__send_data(obj, uuid)
