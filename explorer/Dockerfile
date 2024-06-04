FROM node:20-alpine
RUN mkdir -p /app

WORKDIR /app

COPY . .
COPY .env .

RUN npm install

# Specify the command to run your application
CMD ["npm", "run", "docker-start"]
