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

# COPY . .
# COPY .env .

WORKDIR /app/api
RUN npm install

WORKDIR /app/explorer
RUN npm install

WORKDIR /app/indexer
RUN npm install

WORKDIR /app
RUN npm install -g typescript ts-node
RUN npm install -g pm2

CMD tsc -p indexer/ && cd ./indexer/ && pm2 start "npm run start" --name indexer && cd ../api && pm2 start "npm run start" --name api && cd ../explorer && pm2 start "npm run docker-start-testnet-dev" --name explorer && pm2 logs
# Specify the command to run your application
# CMD ["npm", "run", "start"]
