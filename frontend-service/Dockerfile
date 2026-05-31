# ============================================
# Dockerfile - Frontend Service
# ============================================
# File ini digunakan untuk membuat Docker image dari service frontend.
# Service ini menyajikan tampilan website SmileOn Lab.
# Dikerjakan oleh Anggota 1.
#
# Cara build:
#   docker build -t smileon-frontend-service ./frontend-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Frontend berjalan di port 3000
EXPOSE 3000

CMD ["node", "app.js"]
