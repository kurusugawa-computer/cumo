#!/bin/bash

WORKDIR="$(cd "$(dirname "${0}")" && pwd)"

set -xe

cd ${WORKDIR}/client
yarn

cd "${WORKDIR}"
PLUGIN_TS=./client/node_modules/.bin/protoc-gen-ts
protoc \
    --python_out=./lib/kci/pointcloudviewer/ \
    --ts_out=import_style=commonjs,binary:./client/src \
    --js_out=import_style=commonjs,binary:./client/src \
    -I. \
    --plugin=protoc-gen-ts="${PLUGIN_TS}" \
    --experimental_allow_proto3_optional \
    protobuf/server.proto
protoc \
  --python_out=./lib/kci/pointcloudviewer/ \
  --ts_out=import_style=commonjs,binary:./client/src \
  --js_out=import_style=commonjs,binary:./client/src \
  -I. \
  --plugin=protoc-gen-ts="${PLUGIN_TS}" \
  --experimental_allow_proto3_optional \
  protobuf/client.proto
rm -rf ./lib/kci/pointcloudviewer/_internal/protobuf
mv ./lib/kci/pointcloudviewer/protobuf ./lib/kci/pointcloudviewer/_internal/
touch ./lib/kci/pointcloudviewer/_internal/protobuf/__init__.py

cd ${WORKDIR}/client
yarn build

cd ${WORKDIR}
rm -rf ./lib/kci/pointcloudviewer/public
cp -R client/public lib/kci/pointcloudviewer/

cd ${WORKDIR}/lib
poetry install
poetry build