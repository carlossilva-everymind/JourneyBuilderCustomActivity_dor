FROM node:19-alpine3.16

ARG diretorio=/usr/src

RUN mkdir -p $diretorio

WORKDIR $diretorio

COPY . $diretorio

RUN npm install

EXPOSE 8090

CMD node ./bin/start