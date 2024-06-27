FROM node:20-alpine
RUN apk add --no-cache bash curl
RUN mkdir -p /app

WORKDIR /app
RUN mkdir api docs explorer indexer
RUN set -x

COPY ./api ./api
COPY ./api/.env ./api

COPY ./docs ./docs

COPY ./explorer ./explorer
COPY ./explorer/.env ./explorer

COPY ./indexer ./indexer
COPY ./indexer/.env ./indexer
RUN ls -la indexer/.env && cat indexer/.env

WORKDIR /app/api
RUN npm install

WORKDIR /app/explorer
RUN npm install

WORKDIR /app/indexer
RUN npm install

WORKDIR /app
RUN npm install -g typescript ts-node
RUN npm install -g pm2
