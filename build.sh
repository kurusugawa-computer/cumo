#!/bin/bash

WORKDIR="$(cd "$(dirname "${0}")" && pwd)"

set -xe

cd ${WORKDIR}/client
yarn

cd "${WORKDIR}"
PLUGIN_TS=./client/node_modules/.bin/protoc-gen-ts
protoc \
    --python_out=./lib/cumo/ \
    --ts_out=import_style=commonjs,binary:./client/src \
    --js_out=import_style=commonjs,binary:./client/src \
    -I. \
    --plugin=protoc-gen-ts="${PLUGIN_TS}" \
    --experimental_allow_proto3_optional \
    protobuf/server.proto
protoc \
  --python_out=./lib/cumo/ \
  --ts_out=import_style=commonjs,binary:./client/src \
  --js_out=import_style=commonjs,binary:./client/src \
  -I. \
  --plugin=protoc-gen-ts="${PLUGIN_TS}" \
  --experimental_allow_proto3_optional \
  protobuf/client.proto
rm -rf ./lib/cumo/_internal/protobuf
mv ./lib/cumo/protobuf ./lib/cumo/_internal/
touch ./lib/cumo/_internal/protobuf/__init__.py

cd ${WORKDIR}/client
yarn lint:eslint
yarn build

cd ${WORKDIR}
rm -rf ./lib/cumo/public
cp -R client/public lib/cumo/
cp README.md lib/

cd ${WORKDIR}/lib
poetry install
poetry run autopep8 --diff --recursive --exit-code --exclude=protobuf,pypcd,docs .
poetry run flake8 --exclude cumo/_vendor,cumo/_internal/protobuf,cumo/__init__.py cumo
poetry run pylint --jobs=0 cumo
poetry build