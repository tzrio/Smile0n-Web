# ============================================
# Dockerfile - Order-Payment Service
# ============================================
# File ini digunakan untuk membuat Docker image dari service pesanan & pembayaran.
# Image ini berbasis Node.js 18 versi Alpine (ringan).
#
# Cara build:
#   docker build -t smileon-order-payment-service ./order-payment-service
#
# Cara run:
#   docker run -p 3003:3000 --env-file ./order-payment-service/.env smileon-order-payment-service
# ============================================

# Menggunakan Node.js 18 versi Alpine (ukuran kecil, cocok untuk container)
FROM node:18-alpine

# Menentukan folder kerja di dalam container
WORKDIR /app

# Menyalin file package.json dan package-lock.json terlebih dahulu
# (agar layer cache Docker bekerja optimal saat install dependencies)
COPY package*.json ./

# Menginstall semua dependencies yang ada di package.json
RUN npm install

# Menyalin semua file source code ke dalam container
COPY . .

# Membuat folder uploads untuk menyimpan bukti pembayaran
RUN mkdir -p /app/uploads

# Membuka port 3000 agar bisa diakses dari luar container
EXPOSE 3000

# Perintah untuk menjalankan aplikasi saat container dimulai
CMD ["node", "app.js"]
