import multiprocessing
import pkgutil
import asyncio
import threading

from http.server import BaseHTTPRequestHandler, HTTPServer
from os.path import join, splitext
from typing import Union, Optional

# pylint: disable=E1101
import websockets
import websockets.server

EXT_TO_MIME = {
    "js": "application/javascript",
    "html": "text/html",
    "css": "text/css",
}


def _MakePointCloudViewerHTTPRequestHandler(websocket_port: int):
    class _PointCloudViewerHTTPRequestHandler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:
            if self.path == "/":
                self.redirect("index.html")
            elif self.path == "/websocket_url":
                self.send_response(200)
                self.end_headers()
                address = self.server.server_address
                assert isinstance(address, tuple)
                self.wfile.write(
                    f"ws://{address[0]}:{websocket_port}".encode("utf-8")
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
                    ext = splitext(self.path)[1][1:]
                    if ext in EXT_TO_MIME:
                        self.send_header("content-type", EXT_TO_MIME[ext])
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
    websocket_connection: Optional[websockets.server.WebSocketServerProtocol] = None

    async def __broadcast():
        nonlocal websocket_connection
        loop = asyncio.get_running_loop()
        try:
            while True:
                data = await loop.run_in_executor(None, websocket_broadcasting_queue.get)
                await websocket_connection.send(data)
        except asyncio.CancelledError:
            pass

    async def __websocket_handler(websocket: websockets.server.WebSocketServerProtocol, _path: str):
        nonlocal websocket_connection
        if websocket_connection is not None:
            await websocket.close()
            return
        websocket_connection = websocket
        loop = asyncio.get_running_loop()
        broadcast_task = loop.create_task(__broadcast())
        try:
            msg: Union[str, bytes]
            async for msg in websocket:
                websocket_message_queue.put(msg)
        finally:
            websocket_connection = None
            broadcast_task.cancel()

    loop = asyncio.get_event_loop()
    http_server = HTTPServer(
        (host, http_port),
        _MakePointCloudViewerHTTPRequestHandler(websocket_port=websocket_port),
    )

    start_server = websockets.server.serve(__websocket_handler,
                                           host=host,
                                           port=websocket_port,
                                           max_size=None,
                                           ping_timeout=60,
                                           )
    loop.run_until_complete(start_server)

    threads = [
        threading.Thread(
            target=loop.run_forever
        ),
        threading.Thread(
            target=http_server.serve_forever
        )
    ]
    thread: threading.Thread
    for thread in threads:
        thread.setDaemon(True)
        thread.start()

    for thread in threads:
        thread.join()
