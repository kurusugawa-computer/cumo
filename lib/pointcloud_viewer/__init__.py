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

from .protobuf import server_pb2
from .protobuf import client_pb2
from . import server

class PointCloudViewer:
    server_process: multiprocessing.Process
    custom_handlers: dict
    websocket_broadcasting_queue: multiprocessing.Queue
    websocket_message_queue: multiprocessing.Queue
    polling_thread: threading.Timer
    polling_interval: int

    def __init__(
        self,
        host: str = "127.0.0.1",
        websocket_port: int = 8081,
        http_port: int = 8082,
        polling_interval: int = 0.1,
        autostart: bool = False
    ) -> None:
        self.custom_handlers = dict()
        self.websocket_broadcasting_queue = multiprocessing.Queue()
        self.websocket_message_queue = multiprocessing.Queue()
        self.server_process = multiprocessing.Process(
            target=server.multiprocessing_worker,
            args=(
                host,
                websocket_port,
                http_port,
                self.websocket_broadcasting_queue,
                self.websocket_message_queue
            ),
            daemon=True
        )
        self.polling_interval = polling_interval
        self.polling_thread = threading.Thread(
            target=lambda: self.__polling()
        )
        if autostart:
            self.start()

    def __polling(self):
        wait_event = threading.Event()
        while True:
            if not self.websocket_message_queue.empty():
                data: bytes = self.websocket_message_queue.get()
                self.__handle_message(data)
            wait_event.wait(self.polling_interval)

    def __handle_message(self, message: bytes):
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
                self.__handle_success(command)
            elif command.result.HasField("failure"):
                self.__handle_failure(command)
        elif command.HasField("image"):
            self.__handle_image(command)
        elif command.HasField("control_changed"):
            self.__handle_control_changed(command)

    def __get_custom_handler(self, uuid: UUID, name: str) -> Optional[Callable]:
        if self.custom_handlers[uuid] != None and self.custom_handlers[uuid][name] != None:
            return self.custom_handlers[uuid][name]
        return None

    def __set_custom_handler(self, uuid: UUID, name: str, func: Callable) -> None:
        if not uuid in self.custom_handlers:
            self.custom_handlers[uuid] = dict()
        self.custom_handlers[uuid][name] = func

    def __handle_image(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_success = self.__get_custom_handler(uuid, "success")
        if on_success != None:
            on_success(command.image.data)

    def __handle_success(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_success = self.__get_custom_handler(uuid, "success")
        if on_success != None:
            on_success(command.result.success)

    def __handle_failure(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_failure = self.__get_custom_handler(uuid, "failure")
        if on_failure != None:
            on_failure(command.result.failure)

    def __handle_control_changed(self, command: client_pb2.ClientCommand):
        uuid = UUID(bytes_le=command.UUID)
        on_changed = self.__get_custom_handler(uuid, "changed")
        if on_changed != None:
            if command.control_changed.HasField("number"):
                on_changed(command.control_changed.number)
            elif command.control_changed.HasField("text"):
                on_changed(command.control_changed.text)
            elif command.control_changed.HasField("boolean"):
                on_changed(command.control_changed.boolean)

    def __send_data(self, pbobj: server_pb2.ServerCommand, uuid: UUID) -> None:
        pbobj.UUID = uuid.bytes_le
        data = base64.b64encode(pbobj.SerializeToString())
        self.websocket_broadcasting_queue.put(data.decode())

    def start(self) -> None:
        self.polling_thread.setDaemon(True)
        self.polling_thread.start()

        self.server_process.start()

    def wait_forever(self) -> None:
        self.polling_thread.join()

    def console_log(
        self,
        message: str,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = server_pb2.ServerCommand()
        obj.log_message = message
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def send_pointcloud_from_open3d(
        self,
        pc: open3d.geometry.PointCloud,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
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
        obj = server_pb2.ServerCommand()
        cloud = server_pb2.PointCloud()
        cloud.data = pcd_bytes
        obj.point_cloud.CopyFrom(cloud)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def capture_screen(
        self,
        on_success: Callable[[bytes], None],
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = server_pb2.ServerCommand()
        obj.capture_screen = True
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def switch_camera_to_orthographic(
        self,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = server_pb2.ServerCommand()
        obj.use_perspective_camera = False
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def switch_camera_to_perspective(
        self,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        obj = server_pb2.ServerCommand()
        obj.use_perspective_camera = True
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def set_orthographic_camera(
        self,
        frustum_height: float = 30,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        camera = server_pb2.SetCamera()
        camera.orthographic_frustum_height = frustum_height
        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def set_perspective_camera(
        self,
        fov: float = 30,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        camera = server_pb2.SetCamera()
        camera.perspective_fov = fov
        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def set_camera_position(
        self,
        x: float,
        y: float,
        z: float,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        position = server_pb2.SetCamera.Vec3f()
        position.x = x
        position.y = y
        position.z = z

        camera = server_pb2.SetCamera()
        camera.position.CopyFrom(position)

        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def set_camera_target(
        self,
        x: float,
        y: float,
        z: float,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None
    ) -> None:
        target = server_pb2.SetCamera.Vec3f()
        target.x = x
        target.y = y
        target.z = z

        camera = server_pb2.SetCamera()
        camera.target.CopyFrom(target)

        obj = server_pb2.ServerCommand()
        obj.set_camera.CopyFrom(camera)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

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
        self.__set_custom_handler(uuid, "changed", on_changed)
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def add_custom_checkbox(
        self,
        name: str = "checkbox",
        init_value: bool = False,
        on_changed: Optional[Callable[[bool], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        checkbox = server_pb2.CustomControl.CheckBox()
        checkbox.name = name
        checkbox.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.checkbox.CopyFrom(checkbox)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "changed", on_changed)
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def add_custom_textbox(
        self,
        name: str = "textbox",
        init_value: str = "",
        on_changed: Optional[Callable[[bool], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        textbox = server_pb2.CustomControl.TextBox()
        textbox.name = name
        textbox.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.textbox.CopyFrom(textbox)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "changed", on_changed)
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def add_custom_selectbox(
        self,
        items: list,
        name: str = "selectbox",
        init_value: str = "",
        on_changed: Optional[Callable[[bool], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        selectbox = server_pb2.CustomControl.SelectBox()
        selectbox.name = name
        selectbox.items.extend(items)
        selectbox.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.selectbox.CopyFrom(selectbox)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "changed", on_changed)
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def add_custom_button(
        self,
        name: str = "button",
        on_changed: Optional[Callable[[], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        button = server_pb2.CustomControl.Button()
        button.name = name
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.button.CopyFrom(button)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "changed", on_changed)
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)

    def add_custom_colorpicker(
        self,
        name: str = "color",
        init_value: str = "#000",
        on_changed: Optional[Callable[[], None]] = None,
        on_success: Optional[Callable[[str], None]] = None,
        on_failure: Optional[Callable[[str], None]] = None,
    ) -> None:
        picker = server_pb2.CustomControl.ColorPicker()
        picker.name = name
        picker.init_value = init_value
        add_custom_control = server_pb2.CustomControl()
        add_custom_control.color_picker.CopyFrom(picker)
        obj = server_pb2.ServerCommand()
        obj.add_custom_control.CopyFrom(add_custom_control)
        uuid = uuid4()
        self.__set_custom_handler(uuid, "changed", on_changed)
        self.__set_custom_handler(uuid, "success", on_success)
        self.__set_custom_handler(uuid, "failure", on_failure)
        self.__send_data(obj, uuid)
