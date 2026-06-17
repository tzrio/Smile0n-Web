# ============================================
# Dockerfile - Frontend
# Owner: Bagus
# ============================================
# Image untuk Frontend Service.
#
# Cara build:
#   docker build -t smileon-frontend ./frontend
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Frontend berjalan di port 3000
EXPOSE 3000

CMD ["node", "app.js"]
