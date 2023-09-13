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
        curl gnupg unzip git sudo\
        make build-essential libssl-dev zlib1g-dev libbz2-dev \
        libreadline-dev libsqlite3-dev llvm libncurses5-dev libncursesw5-dev \
        xz-utils tk-dev libffi-dev liblzma-dev libusb-1.0-0 libgl1-mesa-dev \
        python3-distutils python3-dev \
    && apt-get clean && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && sudo apt-get install -y nodejs

RUN curl https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
    && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
    && apt-get update && apt-get install -y yarn

ENV PROTOC_VERSION=24.2
RUN curl -L -O https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-linux-x86_64.zip \
    && unzip protoc-${PROTOC_VERSION}-linux-x86_64.zip && cp ./bin/protoc /usr/local/bin/. && chmod +x /usr/local/bin/protoc

RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid 1000 -m vscode \
    && echo vscode ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/vscode \
    && chmod 0440 /etc/sudoers.d/vscode

USER vscode
ENV HOME /home/vscode

RUN git clone https://github.com/pyenv/pyenv.git ~/.pyenv \
    && cd ~/.pyenv/plugins/python-build \
    && PREFIX=~/local ./install.sh \
    && ~/local/bin/python-build -v ${PYTHON_VERSION} ~/local/python-${PYTHON_VERSION}

ENV PATH "$PATH:/home/vscode/local/python-3.8.7/bin"
WORKDIR /home/vscode
RUN curl -sSL https://install.python-poetry.org | python3 -

ENV PATH "$PATH:/home/vscode/.local/bin"

RUN poetry config virtualenvs.in-project true
