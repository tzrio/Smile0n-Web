/**
 * SmileOn Lab - API Gateway Configuration
 * Owner: Bagus (Frontend Integration)
 *
 * Konfigurasi terpusat untuk komunikasi frontend dengan backend
 * microservices melalui Nginx API Gateway.
 *
 * Environment variable:
 * - API_GATEWAY_URL: URL API Gateway (default: http://api-gateway)
 *
 * Untuk local development, set API_GATEWAY_URL ke proxy lokal,
 * atau jalankan backend services dengan port mapping yang sesuai.
 */

const axios = require('axios');

const API_GATEWAY = process.env.API_GATEWAY_URL || 'http://api-gateway';

const apiClient = axios.create({
    baseURL: API_GATEWAY,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

module.exports = {
    API_GATEWAY,
    apiClient,
};
