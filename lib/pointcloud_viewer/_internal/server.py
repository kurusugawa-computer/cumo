import multiprocessing
import pkgutil
import asyncio
import threading

from http.server import BaseHTTPRequestHandler, HTTPServer
from os.path import join
from typing import Union

import websockets

class _PointCloudViewerHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/":
            self.redirect("index.html")
        else:
            path = join("/public/", "./"+self.path)
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
        self.send_header(
            "Location", location
        )
        self.end_headers()


def multiprocessing_worker(
    host: str,
    websocket_port: int,
    http_port: int,
    websocket_broadcasting_queue: multiprocessing.Queue,
    websocket_message_queue: multiprocessing.Queue,
):
    websocket_connections = set()

    async def __broadcast():
        while True:
            if not websocket_broadcasting_queue.empty() and 0 < len(websocket_connections):
                data = websocket_broadcasting_queue.get()
                for conn in websocket_connections:
                    conn: websockets.WebSocketServerProtocol = conn
                    await conn.send(data)
            await asyncio.sleep(0.1)

    async def __websocket_handler(websocket: websockets.WebSocketServerProtocol, path: str):
        websocket_connections.add(websocket)
        try:
            async for msg in websocket:
                msg: bytes = msg
                websocket_message_queue.put(msg)
        finally:
            websocket_connections.remove(websocket)

    loop = asyncio.get_event_loop()
    http_server = HTTPServer(
        (host, http_port),
        _PointCloudViewerHTTPRequestHandler,
    )

    loop.create_task(__broadcast())
    start_server = websockets.serve(__websocket_handler,
                                    host=host, port=websocket_port)
    loop.run_until_complete(start_server)

    threads = [
        threading.Thread(
            target=lambda: loop.run_forever()
        ),
        threading.Thread(
            target=lambda: http_server.serve_forever()
        )
    ]
    for thread in threads:
        thread: threading.Thread = thread
        thread.setDaemon(True)
        thread.start()

    for thread in threads:
        thread.join()