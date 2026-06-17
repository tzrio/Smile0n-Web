# SmileOn Lab — Microservices Platform

Platform jasa desain digital berbasis arsitektur microservices menggunakan Docker dan Kubernetes.

---

## 📖 Documentation

| Document | Deskripsi |
|----------|-----------|
| [project.md](project.md) | Architecture overview, repository structure, team ownership |
| [requirements.md](requirements.md) | Functional & non-functional requirements |
| [design.md](design.md) | Technical design, diagrams, database schema |
| [tasks.md](tasks.md) | Task breakdown per team member |

---

## Tim dan Kepemilikan

| Anggota | Service | Kubernetes | Database |
|---------|---------|------------|----------|
| **Bagus** | `frontend/`, `api-gateway/` | `kubernetes/frontend/`, `kubernetes/gateway/` | — |
| **Rakha** | `auth-service/`, `product-service/`, `gallery-service/` | `kubernetes/auth/`, `kubernetes/product/`, `kubernetes/gallery/` | `auth_db`, `product_db`, `gallery_db` |
| **Roihan** | `order-service/`, `payment-service/`, `recommendation-service/` | `kubernetes/order/`, `kubernetes/payment/`, `kubernetes/recommendation/` | `order_db`, `payment_db`, `recommendation_db` |

---

## Struktur Repository

```
Smile0n-Web/
├── frontend/                   (Bagus)
├── api-gateway/                (Bagus)
├── auth-service/               (Rakha)
├── product-service/            (Rakha)
├── gallery-service/            (Rakha)
├── order-service/              (Roihan)
├── payment-service/            (Roihan)
├── recommendation-service/     (Roihan)
├── databases/
│   ├── auth_db.sql             (Rakha)
│   ├── product_db.sql          (Rakha)
│   ├── gallery_db.sql          (Rakha)
│   ├── order_db.sql            (Roihan)
│   ├── payment_db.sql          (Roihan)
│   └── recommendation_db.sql   (Roihan)
├── kubernetes/
│   ├── frontend/               (Bagus)
│   ├── gateway/                (Bagus)
│   ├── auth/                   (Rakha)
│   ├── product/                (Rakha)
│   ├── gallery/                (Rakha)
│   ├── order/                  (Roihan)
│   ├── payment/                (Roihan)
│   └── recommendation/         (Roihan)
├── project.md
├── requirements.md
├── design.md
└── tasks.md
```

---

## Stack Teknologi

| Bagian | Teknologi |
|--------|-----------| 
| Backend | Node.js + Express.js |
| Database | MySQL 8.0 (per-service) |
| File Upload | Multer (payment-service) |
| Container | Docker (node:18-alpine) |
| Orchestration | Kubernetes (Minikube) |
| API Gateway | Nginx |
| Testing | Jest + Supertest + fast-check |
| Inter-Service | Axios (HTTP REST) |

---

## Port Service

| Service | Port |
|---------|------|
| api-gateway (Nginx) | 80 |
| frontend | 3000 |
| auth-service | 3000 |
| product-service | 3000 |
| order-service | 3001 |
| payment-service | 3002 |
| recommendation-service | 3003 |
| gallery-service | 3004 |

---

## Arsitektur: Database Per Service

Setiap microservice memiliki database MySQL-nya sendiri. Tidak ada shared database.
Komunikasi antar service menggunakan HTTP API.

```
order-service            → order_db          (MySQL pod: mysql-order)
payment-service          → payment_db        (MySQL pod: mysql-payment)
recommendation-service   → recommendation_db (MySQL pod: mysql-recommendation)
auth-service             → auth_db           (MySQL pod: mysql-auth)
product-service          → product_db        (MySQL pod: mysql-product)
gallery-service          → gallery_db        (MySQL pod: mysql-portfolio)
```

---

## Cara Menjalankan

### Testing Lokal

```bash
# order-service (Roihan)
cd order-service
npm install
npm test

# payment-service (Roihan)
cd payment-service
npm install
npm test

# recommendation-service (Roihan)
cd recommendation-service
npm install
npm test
```

### Build Docker

```bash
docker build -t smileon-order-service ./order-service
docker build -t smileon-payment-service ./payment-service
docker build -t smileon-recommendation-service ./recommendation-service
docker build -t smileon-auth-service ./auth-service
docker build -t smileon-product-service ./product-service
docker build -t smileon-gallery-service ./gallery-service
docker build -t smileon-frontend ./frontend
docker build -t smileon-api-gateway ./api-gateway
```

### Deploy ke Kubernetes

```bash
kubectl apply -f kubernetes/order/
kubectl apply -f kubernetes/payment/
kubectl apply -f kubernetes/recommendation/
kubectl apply -f kubernetes/auth/
kubectl apply -f kubernetes/product/
kubectl apply -f kubernetes/gallery/
kubectl apply -f kubernetes/frontend/
kubectl apply -f kubernetes/gateway/
```

### Cek Status

```bash
kubectl get pods
kubectl get services
kubectl get deployments
```

---

## Alur API Gateway (Nginx)

```
User → api-gateway:80
  /                      → frontend:3000
  /api/auth/             → auth-service:3000
  /api/products/         → product-service:3000
  /api/orders/           → order-service:3001
  /api/payments/         → payment-service:3002
  /api/recommendations/  → recommendation-service:3003
  /api/gallery/          → gallery-service:3004
```

---

## Status Implementasi

| Service | Status |
|---------|--------|
| order-service | ✅ Fully Implemented & Tested |
| payment-service | ✅ Fully Implemented & Tested |
| recommendation-service | ✅ Fully Implemented & Tested |
| auth-service | 🔧 Stub, dikerjakan Rakha |
| product-service | 🔧 Stub, dikerjakan Rakha |
| gallery-service | 🔧 Stub, dikerjakan Rakha |
| frontend | 🔧 Stub, dikerjakan Bagus |
| api-gateway | ✅ Nginx configured |

---

## Aturan Arsitektur

- `frontend/` dan `api-gateway/` adalah **bukan microservice**
- Hanya 6 yang dianggap microservice: auth, product, order, payment, recommendation, gallery
- Setiap microservice memiliki database-nya sendiri
- **Tidak ada shared database** antar service — tidak ada shadow tables
- Komunikasi antar service menggunakan **HTTP API** (bukan direct DB query)
- Setiap service memiliki Deployment, Service, dan MySQL Kubernetes sendiri
