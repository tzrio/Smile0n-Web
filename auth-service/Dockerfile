# ============================================
# Dockerfile - Auth Service
# ============================================
# File ini digunakan untuk membuat Docker image dari service autentikasi.
# Service ini menangani register, login, dan role user/admin.
# Dikerjakan oleh Anggota 2.
#
# Cara build:
#   docker build -t smileon-auth-service ./auth-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Auth service berjalan di port 3000
EXPOSE 3000

CMD ["node", "app.js"]
