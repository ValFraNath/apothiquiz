FROM node:16

WORKDIR /usr/app

COPY package.json package-lock.json ./

RUN npm install
