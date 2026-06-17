# ============================================
# Dockerfile - Payment Service
# Owner: Roihan
# ============================================
# Image untuk Payment Service.
#
# Cara build:
#   docker build -t smileon-payment-service ./payment-service
#
# Cara run:
#   docker run -p 3002:3002 --env-file ./payment-service/.env smileon-payment-service
# ============================================

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Membuat folder uploads untuk menyimpan bukti pembayaran
RUN mkdir -p /app/uploads

EXPOSE 3002

CMD ["node", "app.js"]
