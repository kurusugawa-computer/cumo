#!/bin/bash

DOCKER_IMAGE="pointcloud-viewer-builder"

if [[ "$(docker images -q ${DOCKER_IMAGE} 2> /dev/null)" == "" ]]; then
  docker build -t ${DOCKER_IMAGE} - < Dockerfile
fi

docker run --rm -v ${PWD}:/workdir -w /workdir ${DOCKER_IMAGE} bash build-on-container.sh