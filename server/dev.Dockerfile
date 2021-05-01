FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT 5035

EXPOSE 5035

CMD ["node", "index.js"]
