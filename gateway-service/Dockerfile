# ============================================
# Dockerfile - Gateway Service (Nginx)
# ============================================
# File ini digunakan untuk membuat Docker image dari API Gateway.
# Gateway menggunakan Nginx untuk meneruskan request dari user
# ke service backend yang sesuai (auth, product, order-payment).
# Dikerjakan oleh Anggota 1.
#
# Cara build:
#   docker build -t smileon-gateway-service ./gateway-service
# ============================================

# Menggunakan Nginx versi Alpine (ringan)
FROM nginx:alpine

# Menyalin konfigurasi Nginx custom ke dalam container
COPY nginx.conf /etc/nginx/nginx.conf

# Gateway menerima request di port 80
EXPOSE 80

# Menjalankan Nginx di foreground (agar container tidak langsung berhenti)
CMD ["nginx", "-g", "daemon off;"]
