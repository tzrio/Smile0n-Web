# ============================================
# Dockerfile - Order Service
# Owner: Roihan
# ============================================
# Image untuk Order Service.
#
# Cara build:
#   docker build -t smileon-order-service ./order-service
#
# Cara run:
#   docker run -p 3003:3003 --env-file ./order-service/.env smileon-order-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3003

CMD ["node", "app.js"]
