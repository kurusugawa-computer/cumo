# cumo

cumoは、Pythonから3D点群をブラウザ上で表示するためのライブラリです。

## インストール

```console
$ pip install cumo
```

## ドキュメント

sphinxでドキュメントの生成が可能です。
devcontainer環境を使用することで、ビルド環境を構築することができます。
その中で以下のようにすると、`lib/docs/`以下にドキュメントが生成されます。

```console
$ cd lib
$ poetry install
$ poetry run sphinx-apidoc --append-syspath -F -o ./docs .
```

## 使用例

`lib/cumo/__main__.py`は3面図を撮る例です。
`lib/`以下に適当なPCDファイル(以下の例では`pcl_logo.pcd`)を用意して、以下のようにするとpcdファイルを閲覧できます。

```console
$ cd lib
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

## cumo開発者向け

### 大まかな構成

cumoは以下のように、大まかに2つの要素からなります。

- `lib/` : Pythonライブラリ。PointCloudViewerクラスを提供する。クライアントのHTMLを配信し、クライアントとWebSocket通信を行う。
- `client/` : クライアントページ。ライブラリとWebSocket通信を行い、ライブラリからの操作を受け付ける。

これら2つの通信はWebSocketを使用しています。
通信データはProtocol Buffersにより定義されており、それぞれで使われている言語のライブラリが自動で生成されます。

- `protobuf/server.proto`: ライブラリからクライアントへ送信されるデータ
- `protobuf/client.proto`: クライアントからライブラリへ送信されるデータ

### ビルド

devcontainerを使用することで、ビルド環境を構築することができます。
devcontainer環境に入り、下のようにすると`lib/dist/`以下にtar.gzとwhlファイルが生成されます。
クライアントのHTML等はライブラリに含まれ、tar.gzやwhlファイルの中に格納されます。

```console
$ ./build.sh
```

### テスト

以下のようにするとテスト用のモードでクライアントページを配信することができます。

```console
$ cd client
$ yarn serve
```

上のようにしてクライアントを配信するサーバを起動した後、ブラウザでクライアントを開きます(大抵の場合自動で開かれます)。
クライアントを開いた後、ライブラリ側を起動するとクライアント側に接続されます。

```console
$ cd lib
$ poetry run python -m cumo pcl_logo.pcd
```
