# Auth Service Dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5005

CMD ["node", "server.js"]
