# ============================================
# Dockerfile - API Gateway (Nginx)
# Owner: Bagus
# ============================================
# Image untuk API Gateway menggunakan Nginx.
# Gateway meneruskan request dari user ke service backend
# yang sesuai berdasarkan path URL.
#
# Cara build:
#   docker build -t smileon-api-gateway ./api-gateway
# ============================================

# Menggunakan Nginx versi Alpine (ringan)
FROM nginx:alpine

# Menyalin konfigurasi Nginx custom ke dalam container
COPY nginx.conf /etc/nginx/nginx.conf

# Gateway menerima request di port 80
EXPOSE 80

# Menjalankan Nginx di foreground
CMD ["nginx", "-g", "daemon off;"]
