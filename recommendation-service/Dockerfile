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
#   docker run -p 3005:3005 --env-file ./recommendation-service/.env smileon-recommendation-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3005

CMD ["node", "app.js"]
