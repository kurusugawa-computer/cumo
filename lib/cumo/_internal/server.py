import multiprocessing
import pkgutil
import asyncio
import threading

from http.server import BaseHTTPRequestHandler, HTTPServer
from os.path import join
from typing import Union, Optional

import websockets


def _MakePointCloudViewerHTTPRequestHandler(websocket_port: int):
    class _PointCloudViewerHTTPRequestHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/":
                self.redirect("index.html")
            elif self.path == "/websocket_url":
                self.send_response(200)
                self.end_headers()
                self.wfile.write(
                    f"ws://{self.server.server_address[0]}:{websocket_port}".encode("utf-8")
                )
            else:
                path = join("/public/", "./"+self.path)
                data: Union[bytes, None] = None
                try:
                    data = pkgutil.get_data("cumo", path)
                except FileNotFoundError:
                    self.send_error(404)
                if data is not None:
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(data)
                else:
                    self.send_error(404)

        # pylint: disable=W0622
        def log_message(self, format: str, *args) -> None:
            pass

        def redirect(self, path: str):
            self.send_response(301)
            location = path
            self.send_header(
                "Location", location
            )
            self.end_headers()
    return _PointCloudViewerHTTPRequestHandler


def multiprocessing_worker(
    host: str,
    websocket_port: int,
    http_port: int,
    websocket_broadcasting_queue: multiprocessing.Queue,
    websocket_message_queue: multiprocessing.Queue,
):
    websocket_connection: Optional[websockets.WebSocketServerProtocol] = None

    async def __broadcast():
        nonlocal websocket_connection
        loop = asyncio.get_running_loop()
        try:
            while True:
                data = await loop.run_in_executor(None, websocket_broadcasting_queue.get)
                await websocket_connection.send(data)
        except asyncio.CancelledError:
            pass

    async def __websocket_handler(websocket: websockets.WebSocketServerProtocol, _path: str):
        nonlocal websocket_connection
        if websocket_connection is not None:
            await websocket.close()
            return
        websocket_connection = websocket
        loop = asyncio.get_running_loop()
        broadcast_task = loop.create_task(__broadcast())
        try:
            async for msg in websocket:
                msg: bytes = msg
                websocket_message_queue.put(msg)
        finally:
            websocket_connection = None
            broadcast_task.cancel()

    loop = asyncio.get_event_loop()
    http_server = HTTPServer(
        (host, http_port),
        _MakePointCloudViewerHTTPRequestHandler(websocket_port=websocket_port),
    )

    start_server = websockets.serve(__websocket_handler,
                                    host=host,
                                    port=websocket_port,
                                    max_size=None)
    loop.run_until_complete(start_server)

    threads = [
        threading.Thread(
            target=loop.run_forever
        ),
        threading.Thread(
            target=http_server.serve_forever
        )
    ]
    for thread in threads:
        thread: threading.Thread = thread
        thread.setDaemon(True)
        thread.start()

    for thread in threads:
        thread.join()
