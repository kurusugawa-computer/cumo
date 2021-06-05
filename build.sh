#!/bin/bash

WORKDIR="$(cd "$(dirname "${0}")" && pwd)"

set -xe

cd ${WORKDIR}/client
yarn

cd "${WORKDIR}"
PLUGIN_TS=./client/node_modules/.bin/protoc-gen-ts
protoc \
    --python_out=./lib/pointcloud_viewer/ \
    --ts_out=import_style=commonjs,binary:./client/src \
    --js_out=import_style=commonjs,binary:./client/src \
    -I. \
    --plugin=protoc-gen-ts="${PLUGIN_TS}" \
    protobuf/server.proto
protoc \
  --python_out=./lib/pointcloud_viewer/ \
  --ts_out=import_style=commonjs,binary:./client/src \
  --js_out=import_style=commonjs,binary:./client/src \
  -I. \
  --plugin=protoc-gen-ts="${PLUGIN_TS}" \
  protobuf/client.proto
rm -rf ./lib/pointcloud_viewer/_protobuf
mv ./lib/pointcloud_viewer/protobuf ./lib/pointcloud_viewer/_protobuf

cd ${WORKDIR}/client
yarn build

cd ${WORKDIR}
rm -rf ./lib/pointcloud_viewer/public
cp -R client/public lib/pointcloud_viewer/

cd ${WORKDIR}/lib
poetry install
poetry build