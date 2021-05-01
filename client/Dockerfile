FROM node:14-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

# Manually copying public and src to not copy nginx.conf
COPY public/ ./public/
COPY src/ ./src/

ARG REACT_APP_VERSION="development"

RUN npm run build

# ------------------------------------------------------
# Production Build
# ------------------------------------------------------
FROM nginx:1.16.0-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx-react.conf /etc/nginx/conf.d

COPY --from=builder /app/build /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
