# cumo

## ビルド

yarn、protoc、poetryが必要です（`.devcontainer/Dockerfile`参照）。
以下のようにすると`lib/dist`にtar.gzとwhlファイルが生成されます。
クライアントのHTML等はライブラリに埋め込まれています。

```console
$ ./build.sh
```

## インストール

```console
$ pip install pointcloud-viewer
```

## ドキュメント

sphinxでドキュメントの生成が可能です。

```console
$ cd lib
$ poetry install
$ poetry run sphinx-apidoc --append-syspath -F -o ./docs .
```

## 使用例

`lib/cumo/__main__.py`は3面図を撮る例です。

```console
$ poetry run python -m cumo pcl_logo.pcd
open: http://127.0.0.1:8082
setup...
resize window and press custom control button "start"
saved: screenshot_x.png
saved: screenshot_y.png
saved: screenshot_z.png
```

REPLでの使用も可能です。

```console
$ poetry run python
Python 3.8.7 (default, Apr  9 2022, 21:34:33)
[GCC 9.4.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> from cumo import PointCloudViewer
>>> viewer = PointCloudViewer()
>>> viewer.start()
>>> # open localhost:8082 on your browser
>>> with open(filename, "rb") as f:
>>>     b = f.read()
>>>     viewer.send_pointcloud_pcd(b)
```
