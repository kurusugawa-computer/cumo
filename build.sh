SCRIPT_DIR=$(
    cd $(dirname $0)
    pwd
)

DOCKER_IMAGE="pointcloud-viewer-builder"

set -xe

if [[ "$(docker images -q ${DOCKER_IMAGE} 2> /dev/null)" == "" ]]; then
  docker build -t ${DOCKER_IMAGE} - < Dockerfile
fi

cd ${SCRIPT_DIR}/client
YARN="docker run --rm -v ${PWD}:/workdir -w /workdir ${DOCKER_IMAGE} yarn"
${YARN}

cd "${SCRIPT_DIR}"
PROTOC="docker run --rm -v ${PWD}:/workdir -w /workdir ${DOCKER_IMAGE} protoc"
PLUGIN_TS=./client/node_modules/.bin/protoc-gen-ts
${PROTOC} \
    --python_out=./lib/pointcloud_viewer/ \
    --ts_out=import_style=commonjs,binary:./client/src \
    --js_out=import_style=commonjs,binary:./client/src \
    -I. \
    --plugin=protoc-gen-ts="${PLUGIN_TS}" \
    protobuf/server.proto
${PROTOC} \
  --python_out=./lib/pointcloud_viewer/ \
  --ts_out=import_style=commonjs,binary:./client/src \
  --js_out=import_style=commonjs,binary:./client/src \
  -I. \
  --plugin=protoc-gen-ts="${PLUGIN_TS}" \
  protobuf/client.proto

cd ${SCRIPT_DIR}/client
${YARN} build

cd ${SCRIPT_DIR}
rm -rf ./lib/pointcloud_viewer/public
cp -R client/public lib/pointcloud_viewer/

cd lib
POETRY="docker run --rm -v ${PWD}:/workdir -w /workdir ${DOCKER_IMAGE} poetry"
${POETRY} build