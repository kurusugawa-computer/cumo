from __future__ import annotations  # Postponed Evaluation of Annotations
from typing import TYPE_CHECKING
from uuid import uuid4
from cumo._internal.protobuf import server_pb2
if TYPE_CHECKING:
    from cumo import PointCloudViewer


def wait_forever(self: PointCloudViewer) -> None:
    """
    サーバーが動作している間待ち続ける。
    この関数を実行した後にコールバック内で ``sys.exit()`` を呼び出すなどすることでプログラムを終了できる。
    """
    self._wait_until(None)


def console_log(
    self: PointCloudViewer,
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


def start(self: PointCloudViewer) -> None:
    """
    サーバープロセスを起動する。
    """

    self._server_process.start()
