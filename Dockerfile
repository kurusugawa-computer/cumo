FROM ubuntu:20.04

ENV PYTHON_VERSION 3.8.7
ENV HOME /root
ENV PYTHON_ROOT $HOME/local/python-$PYTHON_VERSION
ENV PATH $PYTHON_ROOT/bin:$HOME/.poetry/bin:$PATH

RUN apt-get update \
    && apt-get install -y ca-certificates \
    && sed -i.bak -e 's%http://[^ ]\+%mirror://mirrors.ubuntu.com/mirrors.txt%g' /etc/apt/sources.list

RUN apt-get update && apt-get install -y curl gnupg unzip

RUN curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get update && apt-get install -y yarn

RUN curl -L -O https://github.com/protocolbuffers/protobuf/releases/download/v3.15.6/protoc-3.15.6-linux-x86_64.zip \
    && unzip protoc-3.15.6-linux-x86_64.zip && cp ./bin/protoc /usr/local/bin/. && chmod +x /usr/local/bin/protoc

RUN apt-get update && apt-get install -y make build-essential libssl-dev zlib1g-dev libbz2-dev \
    libreadline-dev libsqlite3-dev llvm libncurses5-dev libncursesw5-dev \
    xz-utils tk-dev libffi-dev liblzma-dev git \
    && git clone https://github.com/pyenv/pyenv.git ~/.pyenv \
    && cd ~/.pyenv/plugins/python-build \
    && ./install.sh \
    && /usr/local/bin/python-build -v ${PYTHON_VERSION} ~/local/python-${PYTHON_VERSION}

RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python3
