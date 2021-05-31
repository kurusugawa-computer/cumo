FROM ubuntu:20.04

ENV PYTHON_VERSION 3.8.7
ENV HOME /root
ENV PYTHON_ROOT $HOME/local/python-$PYTHON_VERSION
ENV PATH $PYTHON_ROOT/bin:$HOME/.poetry/bin:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
    && apt-get clean && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tzdata \
    && apt-get clean && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* \
    && ln -sf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime \
    && echo 'Asia/Tokyo' >/etc/timezone

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl gnupg unzip git \
        make build-essential libssl-dev zlib1g-dev libbz2-dev \
        libreadline-dev libsqlite3-dev llvm libncurses5-dev libncursesw5-dev \
        xz-utils tk-dev libffi-dev liblzma-dev \
    && apt-get clean && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*

RUN curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get update && apt-get install -y yarn

RUN curl -L -O https://github.com/protocolbuffers/protobuf/releases/download/v3.15.6/protoc-3.15.6-linux-x86_64.zip \
    && unzip protoc-3.15.6-linux-x86_64.zip && cp ./bin/protoc /usr/local/bin/. && chmod +x /usr/local/bin/protoc

RUN git clone https://github.com/pyenv/pyenv.git ~/.pyenv \
    && cd ~/.pyenv/plugins/python-build \
    && ./install.sh \
    && /usr/local/bin/python-build -v ${PYTHON_VERSION} ~/local/python-${PYTHON_VERSION}

RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python3
