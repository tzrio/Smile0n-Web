# Diagnosis Report — Frontend Backend Integration

**Ferment:** 019edddc-77de-75ec-bbab-16ce46b7c2bd  
**Date:** 2026-06-19  
**Scope:** Phase 1, Step 1 — Diagnose current frontend/backend integration failures

---

## 1. Frontend Status

| Check | Result |
|-------|--------|
| `npm install` | ✅ Success (0 vulnerabilities) |
| `npm start` | ✅ Starts on port 3000 (or override via `PORT` env) |
| Dependencies | All present including `multer`, `axios`, `express-session` |

**App structure:** Express + EJS. Entry: `app.js`. Routes: `routes/index.js`. Views: `views/`. Static assets: `public/`.

---

## 2. Existing Frontend Routes (routes/index.js)

| Route | Method | Backend Call | Status |
|-------|--------|--------------|--------|
| `/` | GET | — | ✅ Renders home |
| `/login` | GET | — | ✅ Renders login form |
| `/login` | POST | `/api/auth/login` | ✅ Implemented with session + JWT decode |
| `/register` | GET | — | ✅ Renders register form |
| `/register` | POST | `/api/auth/register` | ✅ Implemented |
| `/logout` | GET | — | ✅ Destroys session |
| `/products` | GET | `/api/products` | ⚠️ Calls backend, falls back to `[]` on error |
| `/order` | GET | — | ⚠️ Renders form (NO data fetch) |
| `/order` | POST | `/api/orders` | ⚠️ Implemented, but `user_id` field sent as `user_id` |
| `/payment` | GET | `/api/orders/:id` | ⚠️ Fetches order, then renders payment form |
| `/payment` | POST | `/api/payments/upload` | ⚠️ Multipart upload via FormData |
| `/gallery` | GET | `/api/gallery` | ⚠️ Calls backend, falls back to `[]` on error |
| `/recommendation` | GET | `/api/recommendations` | ⚠️ Calls backend, falls back to `[]` on error |

**Missing routes (user-facing):**
- ❌ `GET /orders` — No order-history page for logged-in user
- ❌ `GET /products/:id` — No product-detail page
- ❌ `GET /payments` — No payment-status tracking page

**Missing routes (admin):**
- ❌ `GET /admin/orders` — No admin order dashboard
- ❌ `POST /admin/orders/:id/status` — No order status update
- ❌ `POST /admin/payments/:id/verify` — No payment verification

---

## 3. Backend Service Status

| Service | Port | Has Routes | Controller Size | DB Config | Notes |
|---------|------|------------|-----------------|-----------|-------|
| auth-service | 3000 | ✅ | 142 lines | `192.168.56.101` | Real endpoints: register, login, users, profile |
| product-service | 3001 | ✅ | 263 lines | `192.168.56.101` | Real endpoints: CRUD + recommendations |
| gallery-service | 3002 (default) | ✅ | 155 lines | `192.168.56.101` | Real endpoints: CRUD |
| order-service | 3003 | ✅ | 177 lines | `192.168.56.101` | Fully implemented per README |
| payment-service | 3004 | ✅ | 191 lines | `192.168.56.101` | Fully implemented per README |
| recommendation-service | 3005 | ✅ | 130 lines | `192.168.56.101` | Fully implemented per README |

**Key finding:** auth-service, product-service, and gallery-service are **NOT empty stubs**. They have real controllers, routes, and DB configurations. The `🔧 Stub` label in tasks.md appears outdated. The primary blocker is that **all services point to DB_HOST=192.168.56.101**, which is unavailable in this local environment.

---

## 4. Identified Issues

### 4.1 Port Conflict (Local Dev)
- **auth-service** defaults to **port 3000**, same as the frontend.
- Running both locally without `PORT` override will cause `EADDRINUSE`.
- **Impact:** Local development friction; not an issue inside K8s.

### 4.2 Unreachable Database
- All backend `.env` files point to `DB_HOST=192.168.56.101`.
- That host is not reachable from this environment.
- **Impact:** Backend services will crash or return DB-connection errors locally. Frontend fallbacks (`products: []`, `galleryItems: []`, `recommendations: []`) will activate, so pages won't crash but data will be empty.

### 4.3 Missing User-Facing Pages
- Users cannot see their order history after placing an order.
- Users cannot view product details before ordering.
- Users cannot track payment status after uploading proof.

### 4.4 Missing Admin Flow
- No admin middleware (`isAdmin`) exists in `routes/index.js`.
- No admin dashboard for viewing all orders.
- No UI for updating order status or verifying payments.

### 4.5 Frontend–Backend API Mismatch Potential
- `/order` POST sends `user_id` as a field. The order-service accepts `user_id` (confirmed from README and controller), so this is likely correct.
- `/payment` POST sends `user_id`, `order_id`, `metode_pembayaran`, `jumlah` plus multipart file. This matches the payment-service `/payments/upload` endpoint.
- **No obvious data-format mismatches** in the existing code.

### 4.6 API Gateway Resolution
- Frontend defaults to `http://api-gateway`.
- Locally, `api-gateway` will not resolve unless added to `/etc/hosts` or an Nginx container is running.
- **Impact:** Frontend API calls will get `ENOTFOUND` errors unless `API_GATEWAY_URL` env var is set (e.g., `http://localhost:3000` for auth, `http://localhost:3001` for product, etc.). However, the frontend calls everything through a **single** gateway, so local testing requires either:
  1. Running the Nginx API Gateway locally, or
  2. Pointing `API_GATEWAY_URL` at a local proxy.

---

## 5. What Works Right Now (No Changes Needed)

- ✅ Frontend server starts without errors (after `npm install`).
- ✅ Auth pages (`/login`, `/register`) render correctly.
- ✅ Session, flash-messages, and static-asset middleware are set up properly.
- ✅ Existing routes have sensible try/catch fallbacks — pages won't crash if backends are down.
- ✅ All backend services have real route/controller files, not just empty stubs.

---

## 6. Recommended Fix Priority

1. **Create missing user pages:** `/orders`, `/products/:id`, `/payments`
2. **Create admin pages:** `/admin/orders` with status update and payment verification
3. **Add `isAdmin` middleware** in `routes/index.js`
4. **Improve UI/UX** on existing `order.ejs`, `payment.ejs`, and new pages
5. **Document local dev workaround** for port conflict and API Gateway resolution (optional, for developer convenience)
