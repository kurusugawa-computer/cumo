__all__ = ["PointCloudViewer"]

import multiprocessing


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

    from pointcloud_viewer._internal.members.capture_screen import capture_screen
    from pointcloud_viewer._internal.members.camera import set_camera_position, set_camera_target, set_orthographic_camera, set_perspective_camera
    from pointcloud_viewer._internal.members.custom_control import add_custom_button, add_custom_checkbox, add_custom_colorpicker, add_custom_selectbox, add_custom_slider, add_custom_textbox, remove_all_custom_controls, remove_custom_control
    from pointcloud_viewer._internal.members.internal_utils import __init__
    from pointcloud_viewer._internal.members.send_object import send_lineset_from_open3d, send_overlay_text, send_pointcloud
    from pointcloud_viewer._internal.members.utils import wait_forever, console_log, start
    from pointcloud_viewer._internal.members.event_handler import _get_custom_handler, _handle_message, _send_data, _set_custom_handler, _wait_until
    from pointcloud_viewer._internal.members.keyboard_event_handler import add_keyup_handler, remove_keyup_handler, add_keydown_handler, remove_keydown_handler, add_keypress_handler, remove_keypress_handler
    from pointcloud_viewer._internal.members.remove_object import remove_all_objects, remove_object
