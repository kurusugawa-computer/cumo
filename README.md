# kciguild-pointcloud-viewer

## ビルド

以下のようにすると`lib/dist`にtar.gzとwhlファイルが生成されます。
クライアントのHTML等は埋め込まれています。

```console
$ ./build.sh
```

## インストール

```console
$ pip install lib/dist/pointcloud_viewer-0.1.0.tar.gz
```

## ドキュメント

sphinxでドキュメントの生成が可能です。

```console
$ cd lib
$ poetry run sphinx-apidoc --append-syspath -F -o ./docs .
```

## 使用例

`lib/pointcloud_viewer/__main__.py`は3面図を撮る例です。

```console
$ poetry run python -m pointcloud_viewer pcl_logo.pcd
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
Python 3.8.7 (default, Mar 16 2021, 19:11:33)
[GCC 10.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import pointcloud_viewer
>>> viewer = pointcloud_viewer.PointCloudViewer()
>>> viewer.start()
>>> # open localhost:8082 on your browser
>>> import open3d
>>> pc = open3d.io.read_point_cloud("pcl_logo.pcd")
>>> viewer.send_pointcloud_from_open3d(pc)
```
