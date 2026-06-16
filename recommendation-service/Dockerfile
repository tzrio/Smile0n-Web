# ============================================
# Dockerfile - Recommendation Service
# Owner: Roihan
# ============================================
# Image untuk Recommendation Service.
#
# Cara build:
#   docker build -t smileon-recommendation-service ./recommendation-service
#
# Cara run:
#   docker run -p 3003:3003 --env-file ./recommendation-service/.env smileon-recommendation-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3003

CMD ["node", "app.js"]
