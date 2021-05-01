FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

ENV PORT 5035
EXPOSE 5035

CMD ["npm", "start"]
