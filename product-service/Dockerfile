# ============================================
# Dockerfile - Product Service
# ============================================
# File ini digunakan untuk membuat Docker image dari service produk.
# Service ini menangani daftar produk, detail produk, dan CRUD produk.
# Dikerjakan oleh Anggota 2.
#
# Cara build:
#   docker build -t smileon-product-service ./product-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Product service berjalan di port 3000
EXPOSE 3000

CMD ["node", "app.js"]
