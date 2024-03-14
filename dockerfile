FROM node:20-alpine

WORKDIR /src

COPY package*.json ./

COPY . /src

RUN apk add chromium

RUN npm install