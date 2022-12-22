__all__ = ["PointCloudViewer"]

import multiprocessing
from enum import Enum, auto
from typing import Optional

# pylint: disable=import-outside-toplevel


class DownSampleStrategy(Enum):
    NONE = auto()
    RANDOM_SAMPLE = auto()
    VOXEL_GRID = auto()

    voxel_size: Optional[float]

    def set_voxel_size(self, voxel_size):
        self.voxel_size = voxel_size
        return self


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
    _key_event_handlers: dict
    _websocket_broadcasting_queue: multiprocessing.Queue
    _websocket_message_queue: multiprocessing.Queue

    from cumo._internal.members.capture_screen import (
        capture_screen,
        capture_screen_as_ndarray,
    )
    from cumo._internal.members.camera import (
        set_camera_position,
        set_camera_target,
        set_orthographic_camera,
        set_perspective_camera,
        set_camera_roll,
        set_camera_roll_lock,
    )
    from cumo._internal.members.custom_control import (
        add_custom_button,
        add_custom_checkbox,
        add_custom_colorpicker,
        add_custom_selectbox,
        add_custom_slider,
        add_custom_textbox,
        add_custom_folder,
        remove_all_custom_controls,
        remove_custom_control,
    )
    from cumo._internal.members.internal_utils import __init__
    from cumo._internal.members.send_object import (
        send_lineset,
        send_overlay_text,
        send_overlay_image,
        send_overlay_image_from_ndarray,
        send_pointcloud,
        send_pointcloud_pcd,
        send_mesh,
        send_image,
    )
    from cumo._internal.members.utils import (
        wait_forever,
        console_log,
        start,
    )
    from cumo._internal.members.event_handler import (
        _get_custom_handler,
        _handle_message,
        _send_data,
        _set_custom_handler,
        _wait_until,
    )
    from cumo._internal.members.keyboard_event_handler import (
        add_keyup_handler,
        remove_keyup_handler,
        add_keydown_handler,
        remove_keydown_handler,
        add_keypress_handler,
        remove_keypress_handler,
    )
    from cumo._internal.members.remove_object import (
        remove_all_objects,
        remove_object,
    )
    from cumo._internal.members.set_custom_control import (
        set_custom_slider,
        set_custom_selectbox,
        set_custom_colorpicker,
        set_custom_textbox,
        set_custom_checkbox,
        set_custom_button,
    )
    from cumo._internal.members.set_enable import (
        stop_render,
        resume_render,
    )
