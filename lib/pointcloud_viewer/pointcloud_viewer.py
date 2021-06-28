__all__ = ["PointCloudViewer"]

import sys
import threading
import base64
import multiprocessing

from uuid import UUID, uuid4
from typing import Callable, Optional

import numpy
from pypcd import pypcd
import open3d
from google.protobuf.message import DecodeError

from pointcloud_viewer._internal.protobuf import server_pb2
from pointcloud_viewer._internal.protobuf import client_pb2
from pointcloud_viewer._internal import server


class PointCloudViewer:
    """点群をブラウザで表示するためのサーバーを立ち上げるビューア。

    :param host: ホスト名
    :type host: str, optional
    :param websocket_port: WebSocketサーバーが待ち受けるポート
    :type websocket_port: int, optional
    :param http_port: Webサーバーが待ち受けるポート
    :type http_port: int, optional
    :param polling_interval: サーバープロセスとのやり取りをする間隔の秒数
    :type polling_interval: int, optional
    :param autostart: Trueの場合、 ``start`` がコンストラクタ実行時に呼び出される
    :type autostart: bool, optional
    """
    _server_process: multiprocessing.Process
    _custom_handlers: dict
    _websocket_broadcasting_queue: multiprocessing.Queue
    _websocket_message_queue: multiprocessing.Queue

    def __init__(
        self,
        host: str = "127.0.0.1",
        websocket_port: int = 8081,
        http_port: int = 8082,
        autostart: bool = False
    ) -> None:
        self._custom_handlers = dict()
        self._websocket_broadcasting_queue = multiprocessing.Queue()
        self._websocket_message_queue = multiprocessing.Queue()
        self._server_process = multiprocessing.Process(
            target=server.multiprocessing_worker,
            args=(
                host,
                websocket_port,
                http_port,
                self._websocket_broadcasting_queue,
                self._websocket_message_queue
            ),
            daemon=True
        )
        if autostart:
            self.start()

    def _wait_until(self, uuid: UUID) -> client_pb2.ClientCommand:
        while True:
            data: bytes = self._websocket_message_queue.get()
            command: client_pb2.ClientCommand = client_pb2.ClientCommand()
            try:
                command.ParseFromString(data)
            except DecodeError:
                raise RuntimeError("failed to parsing message")
            if UUID(bytes_le=command.UUID) == uuid:
                return command
            else:
                self._handle_message(command)

    def _handle_message(self, command: client_pb2.ClientCommand):
        print(command)
        if command.HasField("control_changed"):
            self._handle_control_changed(command)

    def _get_custom_handler(self, uuid: UUID, name: str) -> Optional[Callable]:
        print("get", uuid)
        if self._custom_handlers[uuid] != None and self._custom_handlers[uuid][name] != None:
            return self._custom_handlers[uuid][name]
        return None

    def _set_custom_handler(self, uuid: UUID, name: str, func: Callable) -> None:
        print("set", uuid)
        if not uuid in self._custom_handlers:
            self._custom_handlers[uuid] = dict()
        self._custom_handlers[uuid][name] = func

    def _handle_control_changed(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_changed = self._get_custom_handler(uuid, "changed")
        if on_changed != None:
            if command.control_changed.HasField("number"):
                on_changed(command.control_changed.number)
            elif command.control_changed.HasField("text"):
                on_changed(command.control_changed.text)
            elif command.control_changed.HasField("boolean"):
                on_changed(command.control_changed.boolean)

    def _send_data(self, pbobj: server_pb2.ServerCommand, uuid: UUID) -> None:
        pbobj.UUID = uuid.bytes_le
        data = base64.b64encode(pbobj.SerializeToString())
        self._websocket_broadcasting_queue.put(data.decode())

    def start(self) -> None:
        """
        サーバープロセスを起動する。
        """

        self._server_process.start()

    def wait_forever(self) -> None:
        """
        サーバーが動作している間待ち続ける。
        この関数を実行した後にコールバック内で ``sys.exit()`` を呼び出すなどすることでプログラムを終了できる。
        """
        self._wait_until(None)

    def console_log(
        self,
        message: str,
    ) -> None:
        """ブラウザ上で ``console.log()`` を実行する。

        :param message: ``console.log()`` に引数として渡される文字列
        :type message: str
        """
        obj = server_pb2.ServerCommand()
        obj.log_message = message
        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def send_pointcloud_from_open3d(
        self,
        pc: open3d.geometry.PointCloud,
    ) -> None:
        """点群をブラウザに送信し、表示させる。

        :param pc: 点群。色付きの場合は反映される
        :type pc: open3d.geometry.PointCloud
        """
        pcd: pypcd.PointCloud
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

        cloud = server_pb2.AddObject.PointCloud()
        cloud.pcd_data = pcd_bytes

        add_obj = server_pb2.AddObject()
        add_obj.point_cloud.CopyFrom(cloud)

        obj = server_pb2.ServerCommand()
        obj.add_object.CopyFrom(add_obj)

        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def capture_screen(
        self,
    ) -> bytes:
        """ブラウザのcanvasに表示されている画像をpng形式で保存させる。
        """
        obj = server_pb2.ServerCommand()
        obj.capture_screen = True
        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)
        if ret.HasField("image"):
            return ret.image.data

    def set_orthographic_camera(
        self,
        frustum_height: float = 30,
    ) -> None:
        """カメラを正投影カメラに切り替えさせる。

        :param frustum_height: カメラの視錐台の高さ。幅はウィンドウのアスペクト比から計算される
        :type frustum_height: float, optional
        """
        camera = server_pb2.SetCamera()
        camera.orthographic_frustum_height = frustum_height
        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def set_perspective_camera(
        self,
        fov: float = 30,
    ) -> None:
        """カメラを遠近投影カメラに切り替えさせる。

        :param fov: 視野角
        :type fov: float, optional
        """
        camera = server_pb2.SetCamera()
        camera.perspective_fov = fov
        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def set_camera_position(
        self,
        x: float,
        y: float,
        z: float,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        """カメラの位置を変更する。

        :param x: カメラのx座標
        :type x: float
        :param y: カメラのy座標
        :type y: float
        :param z: カメラのz座標
        :type z: float
        """
        position = server_pb2.VecXYZf()
        position.x = x
        position.y = y
        position.z = z

        camera = server_pb2.SetCamera()
        camera.position.CopyFrom(position)

        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def set_camera_target(
        self,
        x: float,
        y: float,
        z: float,
    ) -> None:
        """カメラが向く目標の座標を変更する。

        :param x: 目標のx座標
        :type x: float
        :param y: 目標のy座標
        :type y: float
        :param z: 目標のz座標
        :type z: float
        """
        target = server_pb2.VecXYZf()
        target.x = x
        target.y = y
        target.z = z

        camera = server_pb2.SetCamera()
        camera.target.CopyFrom(target)

        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def add_custom_slider(
        self,
        name: str = "slider",
        min: float = 0,
        max: float = 100,
        step: float = 1,
        init_value: float = 50,
        on_changed: Optional[Callable[[float], None]] = None,
    ) -> None:
        """カスタムフォルダにスライダーを追加する。

        :param name: 表示名
        :type name: str, optional
        :param min: 最小値
        :type min: float, optional
        :param max: 最大値
        :type max: float, optional
        :param step: 最小の変化量
        :type step: float, optional
        :param init_value: 初期値
        :type init_value: float, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にスライダーの設定値が渡される
        :type on_changed: Optional[Callable[[float], None]], optional
        """
        obj = server_pb2.ServerCommand()
        slider = server_pb2.CustomControl.Slider()
        slider.name = name
        slider.min = min
        slider.max = max
        slider.step = step
        slider.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.slider.CopyFrom(slider)
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self._set_custom_handler(uuid, "changed", on_changed)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def add_custom_checkbox(
        self,
        name: str = "checkbox",
        init_value: bool = False,
        on_changed: Optional[Callable[[bool], None]] = None,
    ) -> None:
        """カスタムフォルダーにチェックボックスを追加する。

        :param name: 表示名
        :type name: str, optional
        :param init_value: 初期値
        :type init_value: bool, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にチェックボックスの設定値が渡される
        :type on_changed: Optional[Callable[[bool], None]], optional
        """
        checkbox = server_pb2.CustomControl.CheckBox()
        checkbox.name = name
        checkbox.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.checkbox.CopyFrom(checkbox)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self._set_custom_handler(uuid, "changed", on_changed)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def add_custom_textbox(
        self,
        name: str = "textbox",
        init_value: str = "",
        on_changed: Optional[Callable[[bool], None]] = None,
    ) -> None:
        """カスタムフォルダーにテキストボックスを追加する。

        :param name: 表示名
        :type name: str, optional
        :param init_value: 初期値
        :type init_value: str, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にテキストボックスの値が渡される
        :type on_changed: Optional[Callable[[bool], None]], optional
        """
        textbox = server_pb2.CustomControl.TextBox()
        textbox.name = name
        textbox.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.textbox.CopyFrom(textbox)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self._set_custom_handler(uuid, "changed", on_changed)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def add_custom_selectbox(
        self,
        items: list,
        name: str = "selectbox",
        init_value: str = "",
        on_changed: Optional[Callable[[bool], None]] = None,
    ) -> None:
        """カスタムフォルダーにセレクトボックスを追加する。

        :param items: 要素の文字列のリスト
        :type items: list
        :param name: 表示名
        :type name: str, optional
        :param init_value: 初期値
        :type init_value: str, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数に選択された要素の文字列が渡される
        :type on_changed: Optional[Callable[[bool], None]], optional
        """
        selectbox = server_pb2.CustomControl.SelectBox()
        selectbox.name = name
        selectbox.items.extend(items)
        selectbox.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.selectbox.CopyFrom(selectbox)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self._set_custom_handler(uuid, "changed", on_changed)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def add_custom_button(
        self,
        name: str = "button",
        on_changed: Optional[Callable[[], None]] = None,
    ) -> None:
        """カスタムフォルダーにボタンを追加する。

        :param name: 表示名
        :type name: str, optional
        :param on_changed: ボタンが押されたときに呼ばれるコールバック関数。引数に ``True`` が渡される
        :type on_changed: Optional[Callable[[], None]], optional
        """
        button = server_pb2.CustomControl.Button()
        button.name = name
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.button.CopyFrom(button)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self._set_custom_handler(uuid, "changed", on_changed)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def add_custom_colorpicker(
        self,
        name: str = "color",
        init_value: str = "#000",
        on_changed: Optional[Callable[[], None]] = None,
    ) -> None:
        """カスタムフォルダーにカラーピッカーを追加する。

        :param name: 表示名
        :type name: str, optional
        :param init_value: 初期値。 ``#ff0000`` 、 ``rgb(255,0,0)`` 等の表現が利用可能
        :type init_value: str, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数に色を表す文字列が渡される
        :type on_changed: Optional[Callable[[], None]], optional
        """
        picker = server_pb2.CustomControl.ColorPicker()
        picker.name = name
        picker.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.color_picker.CopyFrom(picker)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self._set_custom_handler(uuid, "changed", on_changed)
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def send_lineset_from_open3d(
        self,
        lineset: open3d.geometry.LineSet,
    ) -> None:
        """LineSetをブラウザに送信し、表示させる。

        :param lineset: LineSet。
        :type lineset: open3d.geometry.LineSet
        """
        pb_lineset = server_pb2.AddObject.LineSet()
        for v in numpy.asarray(lineset.points):
            p = server_pb2.VecXYZf()
            p.x = v[0]
            p.y = v[1]
            p.z = v[2]
            pb_lineset.points.append(p)
        for l in numpy.asarray(lineset.lines):
            pb_lineset.from_index.append(l[0])
            pb_lineset.to_index.append(l[1])

        add_obj = server_pb2.AddObject()
        add_obj.line_set.CopyFrom(pb_lineset)
        obj = server_pb2.ServerCommand()
        obj.add_object.CopyFrom(add_obj)

        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)

    def send_overlay_text(
        self,
        text: str,
        x: float = 0,
        y: float = 0,
        z: float = 0,
    ) -> None:
        """特定の座標を左上として文字列をオーバーレイさせる。

        :param text: 表示させる文字列
        :type text: str
        :param x: オーバーレイが追従する点のx座標
        :type x: float, optional
        :param y: オーバーレイが追従する点のy座標
        :type y: float, optional
        :param z: オーバーレイが追従する点のz座標
        :type z: float, optional
        """
        overlay = server_pb2.AddObject.Overlay()
        position = server_pb2.VecXYZf()
        position.x = x
        position.y = y
        position.z = z
        overlay.position.CopyFrom(position)
        overlay.text = text
        add_obj = server_pb2.AddObject()
        add_obj.overlay.CopyFrom(overlay)
        obj = server_pb2.ServerCommand()
        obj.add_object.CopyFrom(add_obj)

        uuid = uuid4()
        self._send_data(obj, uuid)
        ret = self._wait_until(uuid)
        if ret.result.HasField("failure"):
            raise RuntimeError(ret.result.failure)
