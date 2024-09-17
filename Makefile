.PHONY: all serve build lint format serve-docs docs clean distclean
.INTERMEDIATE: lib/sample_data.bin lib/README.md

PYTHON_FILES = $(shell find lib -type f -name '*.py')
CLIENT_FILES = $(shell find client/src -type f)

PROTO_PLUGIN_TS = client/node_modules/.bin/protoc-gen-ts
PROTO_PLUGIN_MYPY = lib/.venv/bin/protoc-gen-mypy
PROTO_TS_OPT="no_namespace,json_names,target=node"
PROTO_TS = client/src/protobuf/client.ts client/src/protobuf/server.ts
PROTO_PY = lib/cumo/_internal/protobuf/client_pb2.py lib/cumo/_internal/protobuf/server_pb2.py

# phony targets

all: lint build

serve: ${CLIENT_FILES} ${PROTO_TS} client/node_modules
	cd client && yarn serve

build: lib/README.md lib/cumo/_internal/protobuf/__init__.py client/public/index.html ${PYTHON_FILES} lib/.venv
	cd lib && poetry build

lint: ${PYTHON_FILES} ${CLIENT_FILES} client/node_modules lib/.venv lib/cumo/_internal/protobuf/__init__.py
	cd client && yarn lint:eslint
	cd lib && poetry run autopep8 --diff --recursive --exit-code --exclude=protobuf,pypcd,docs .
	cd lib && poetry run flake8 --exclude cumo/_vendor,cumo/_internal/protobuf,cumo/__init__.py cumo
	cd lib && poetry run mypy cumo
	cd lib && poetry run pylint --jobs=0 cumo

format: ${PYTHON_FILES} ${CLIENT_FILES} client/node_modules lib/.venv
	cd lib && poetry run autopep8 --in-place --recursive --exclude=protobuf,pypcd,docs .
	cd lib && poetry run isort --recursive cumo
	cd client && yarn fix:eslint

serve-docs: docs
	cd lib/docs/_build/html && python3 -m http.server

docs: lib/docs/_build/html/index.html

clean:
	rm -rf lib/dist lib/docs lib/cumo/_internal/protobuf lib/README.md
	rm -rf client/src/protobuf client/public

distclean: clean
	rm -rf lib/.venv
	rm -rf client/node_modules

# protobuf

client/src/protobuf/client.ts: protobuf/client.proto ${PROTO_PLUGIN_TS} ${PROTO_PLUGIN_MYPY}
	protoc \
    --python_out=./lib/cumo/_internal \
    --mypy_out=./lib/cumo/_internal \
    --ts_out=./client/src \
    --ts_opt="${PROTO_TS_OPT}" \
    -I. \
    --plugin=protoc-gen-ts="${PROTO_PLUGIN_TS}" \
    --plugin=protoc-gen-mypy="${PROTO_PLUGIN_MYPY}" \
    --experimental_allow_proto3_optional \
		protobuf/client.proto

lib/cumo/_internal/protobuf/client_pb2.py: client/src/protobuf/client.ts
	@:

client/src/protobuf/server.ts: protobuf/server.proto ${PROTO_PLUGIN_TS} ${PROTO_PLUGIN_MYPY}
	protoc \
		--python_out=./lib/cumo/_internal \
		--mypy_out=./lib/cumo/_internal \
		--ts_out=./client/src \
		--ts_opt="${PROTO_TS_OPT}" \
		-I. \
		--plugin=protoc-gen-ts="${PROTO_PLUGIN_TS}" \
		--plugin=protoc-gen-mypy="${PROTO_PLUGIN_MYPY}" \
		--experimental_allow_proto3_optional \
		protobuf/server.proto

lib/cumo/_internal/protobuf/server_pb2.py: client/src/protobuf/server.ts
	@:

lib/cumo/_internal/protobuf/__init__.py: lib/cumo/_internal/protobuf/client_pb2.py lib/cumo/_internal/protobuf/server_pb2.py
	touch lib/cumo/_internal/protobuf/__init__.py

# client

client/node_modules:
	cd client && yarn install --no-progress

$(PROTO_PLUGIN_TS): client/node_modules
	@:

client/public/index.html: ${CLIENT_FILES} ${PROTO_TS} client/node_modules
	cd client && yarn build

# lib

lib/docs/_build/html/index.html: lib/.venv ${PYTHON_FILES} ${PROTO_PY}
	cd lib && poetry run sphinx-apidoc --append-syspath -F -o ./docs .
	sed -i -e 's/sphinx-build/poetry\ run\ sphinx-build/' lib/docs/Makefile
	cd lib/docs && make html

lib/README.md: README.md
	cp README.md lib/README.md

lib/.venv:
	cd lib && poetry install

$(PROTO_PLUGIN_MYPY): lib/.venv
	@:
