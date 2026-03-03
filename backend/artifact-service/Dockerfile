# Artifact Service Dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 5010

CMD ["node", "src/index.js"]
