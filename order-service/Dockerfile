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
#   docker run -p 3001:3001 --env-file ./order-service/.env smileon-order-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "app.js"]
