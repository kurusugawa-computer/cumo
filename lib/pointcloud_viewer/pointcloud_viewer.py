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
    _polling_thread: threading.Timer
    _polling_interval: int

    def __init__(
        self,
        host: str = "127.0.0.1",
        websocket_port: int = 8081,
        http_port: int = 8082,
        polling_interval: int = 0.1,
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
        self._polling_interval = polling_interval
        self._polling_thread = threading.Thread(
            target=lambda: self._polling()
        )
        if autostart:
            self.start()

    def _polling(self):
        wait_event = threading.Event()
        while True:
            if not self._websocket_message_queue.empty():
                data: bytes = self._websocket_message_queue.get()
                self._handle_message(data)
            wait_event.wait(self._polling_interval)

    def _handle_message(self, message: bytes):
        command: client_pb2.ClientCommand = client_pb2.ClientCommand()
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
                self._handle_success(command)
            elif command.result.HasField("failure"):
                self._handle_failure(command)
        elif command.HasField("image"):
            self._handle_image(command)
        elif command.HasField("control_changed"):
            self._handle_control_changed(command)

    def _get_custom_handler(self, uuid: UUID, name: str) -> Optional[Callable]:
        if self._custom_handlers[uuid] != None and self._custom_handlers[uuid][name] != None:
            return self._custom_handlers[uuid][name]
        return None

    def _set_custom_handler(self, uuid: UUID, name: str, func: Callable) -> None:
        if not uuid in self._custom_handlers:
            self._custom_handlers[uuid] = dict()
        self._custom_handlers[uuid][name] = func

    def _handle_image(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_success = self._get_custom_handler(uuid, "success")
        if on_success != None:
            on_success(command.image.data)

    def _handle_success(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_success = self._get_custom_handler(uuid, "success")
        if on_success != None:
            on_success(command.result.success)

    def _handle_failure(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_failure = self._get_custom_handler(uuid, "failure")
        if on_failure != None:
            on_failure(command.result.failure)

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
        self._polling_thread.setDaemon(True)
        self._polling_thread.start()

        self._server_process.start()

    def wait_forever(self) -> None:
        """
        サーバーが動作している間待ち続ける。
        この関数を実行した後にコールバック内で ``sys.exit()`` を呼び出すなどすることでプログラムを終了できる。
        """
        self._polling_thread.join()

    def console_log(
        self,
        message: str,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        """ブラウザ上で ``console.log()`` を実行する。

        :param message: ``console.log()`` に引数として渡される文字列
        :type message: str
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
        """
        obj = server_pb2.ServerCommand()
        obj.log_message = message
        uuid = uuid4()
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def send_pointcloud_from_open3d(
        self,
        pc: open3d.geometry.PointCloud,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        """点群をブラウザに送信し、表示させる。

        :param pc: 点群。色付きの場合は反映される
        :type pc: open3d.geometry.PointCloud
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def capture_screen(
        self,
        on_success: Callable[[bytes], None],
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        """ブラウザのcanvasに表示されている画像をpng形式で保存させる。

        :param on_success: 成功時に呼ばれるコールバック関数。png形式の画像データが引数として渡される
        :type on_success: Callable[[bytes], None]
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
        """
        obj = server_pb2.ServerCommand()
        obj.capture_screen = True
        uuid = uuid4()
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def set_orthographic_camera(
        self,
        frustum_height: float = 30,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        """カメラを正投影カメラに切り替えさせる。

        :param frustum_height: カメラの視錐台の高さ。幅はウィンドウのアスペクト比から計算される
        :type frustum_height: float, optional
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
        """
        camera = server_pb2.SetCamera()
        camera.orthographic_frustum_height = frustum_height
        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def set_perspective_camera(
        self,
        fov: float = 30,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        """カメラを遠近投影カメラに切り替えさせる。

        :param fov: 視野角
        :type fov: float, optional
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
        """
        camera = server_pb2.SetCamera()
        camera.perspective_fov = fov
        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

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
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def set_camera_target(
        self,
        x: float,
        y: float,
        z: float,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        """カメラが向く目標の座標を変更する。

        :param x: 目標のx座標
        :type x: float
        :param y: 目標のy座標
        :type y: float
        :param z: 目標のz座標
        :type z: float
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def add_custom_slider(
        self,
        name: str = "slider",
        min: float = 0,
        max: float = 100,
        step: float = 1,
        init_value: float = 50,
        on_changed: Optional[Callable[[float], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
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
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def add_custom_checkbox(
        self,
        name: str = "checkbox",
        init_value: bool = False,
        on_changed: Optional[Callable[[bool], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        """カスタムフォルダーにチェックボックスを追加する。

        :param name: 表示名
        :type name: str, optional
        :param init_value: 初期値
        :type init_value: bool, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にチェックボックスの設定値が渡される
        :type on_changed: Optional[Callable[[bool], None]], optional
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def add_custom_textbox(
        self,
        name: str = "textbox",
        init_value: str = "",
        on_changed: Optional[Callable[[bool], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        """カスタムフォルダーにテキストボックスを追加する。

        :param name: 表示名
        :type name: str, optional
        :param init_value: 初期値
        :type init_value: str, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数にテキストボックスの値が渡される
        :type on_changed: Optional[Callable[[bool], None]], optional
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def add_custom_selectbox(
        self,
        items: list,
        name: str = "selectbox",
        init_value: str = "",
        on_changed: Optional[Callable[[bool], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
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
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def add_custom_button(
        self,
        name: str = "button",
        on_changed: Optional[Callable[[], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        """カスタムフォルダーにボタンを追加する。

        :param name: 表示名
        :type name: str, optional
        :param on_changed: ボタンが押されたときに呼ばれるコールバック関数。引数に ``True`` が渡される
        :type on_changed: Optional[Callable[[], None]], optional
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
        """
        button = server_pb2.CustomControl.Button()
        button.name = name
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.button.CopyFrom(button)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self._set_custom_handler(uuid, "changed", on_changed)
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def add_custom_colorpicker(
        self,
        name: str = "color",
        init_value: str = "#000",
        on_changed: Optional[Callable[[], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        """カスタムフォルダーにカラーピッカーを追加する。

        :param name: 表示名
        :type name: str, optional
        :param init_value: 初期値。 ``#ff0000`` 、 ``rgb(255,0,0)`` 等の表現が利用可能
        :type init_value: str, optional
        :param on_changed: 値が変化したときに呼ばれるコールバック関数。引数に色を表す文字列が渡される
        :type on_changed: Optional[Callable[[], None]], optional
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)

    def send_lineset_from_open3d(
        self,
        lineset: open3d.geometry.LineSet,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ):
        """LineSetをブラウザに送信し、表示させる。

        :param lineset: LineSet。
        :type lineset: open3d.geometry.LineSet
        :param on_success: 成功時に呼ばれるコールバック関数
        :type on_success: Optional[Callable[[str], None]], optional
        :param on_failure: 失敗時に呼ばれるコールバック関数
        :type on_failure: Optional[Callable[[str], None]], optional
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
        self._set_custom_handler(uuid, "success", on_success)
        self._set_custom_handler(uuid, "failure", on_failure)
        self._send_data(obj, uuid)
