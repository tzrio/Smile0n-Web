# SmileOn Lab — Frontend-Backend Integration Report

**Date:** 2026-06-19  
**Goal:** Integrate the Express frontend with all backend microservices via the Nginx API Gateway, complete missing user-facing pages, build admin order management, and polish UI/UX.

---

## Summary of Changes

### 1. Centralized API Client Configuration
- **New:** `frontend/config/api.js`
  - Replaced scattered `axios` instances with a single `apiClient` using `axios.create({ baseURL: API_GATEWAY })`.
  - Reads `API_GATEWAY_URL` from environment variables (defaults to `http://api-gateway`).
  - Eliminates hardcoded `http://localhost` strings across the frontend codebase.

### 2. Frontend Routes (`frontend/routes/index.js`)
- **Refactor:** Replaced every inline `axios.get/post(${API_GATEWAY}/api/...)` call with `apiClient.get/post('/api/...')`.
- **New middleware:** `isAdmin` guard for `/admin/*` routes (checks `req.session.user.role === 'admin'`).
- **New routes:**
  - `GET /products/:id` — product detail page calling `/api/products/:id`.
  - `GET /orders` — user order history calling `/api/orders/user/:userId`.
  - `GET /payments` — payment status tracker calling `/api/payments/order/:orderId`.
  - `GET /admin/orders` — admin dashboard listing all orders; fetches payments summary for verification cues.
  - `POST /admin/orders/:id/status` — admin update order status (PUT to `/api/orders/:id/status`).
  - `POST /admin/payments/:id/verify` — admin verify payment (PUT to `/api/payments/:id/verify`).
- **Error handling improvements:**
  - Added `ENOTFOUND` alongside `ECONNREFUSED` for offline-service detection.
  - All new routes render friendly fallback pages (empty arrays, null payment objects) instead of crashing when services are unreachable.

### 3. New EJS Views (User-Facing)
- **`frontend/views/product-detail.ejs`** — Renders single product data with image, price, description, and an action link to order. Shows fallback message if product fails to load.
- **`frontend/views/orders.ejs`** — Order history for the logged-in user. Displays order items in cards with status badges, date formatting, and an empty-state illustration when no orders exist.
- **`frontend/views/payments.ejs`** — Payment tracking page. Accepts `order_id` via query string, calls `/api/payments/order/:order_id`, and shows payment status, method, uploaded proof, and verification badge. Gracefully handles missing order ID or failed lookups.
- **`frontend/views/admin-orders.ejs`** (Admin dashboard) — Lists all orders in a responsive table with status indicators, assigned user, payment proof thumbnail, and action buttons for status updates and payment verification. Includes empty state when no orders exist.

### 4. UI/UX Polish on Existing Views
- **Navigation consistency fixes applied across the following files:**
  - `home.ejs` — Added missing **My Orders** nav link; fixed invalid `styl""` HTML attribute.
  - `products.ejs` — Added missing **My Orders** nav link; fixed invalid `style""` attribute.
  - `product-detail.ejs` — Added missing **My Orders** nav link.
  - `gallery.ejs` — Added missing **My Orders** nav link; fixed broken footer home link (`href="/ "` → `href="/"`).
  - `recommendation.ejs` — Changed navbar from `fixed` to `sticky` (matching every other page); removed compensating `pt-20` on `<main>`; added missing **My Orders** nav link; fixed invalid `style""` attribute.
  - `orders.ejs` — Added missing **Order** nav link.
  - `payment.ejs` — Added missing **Order** nav link.
  - `payments.ejs` — Added missing **Order** nav link.
  - `admin-orders.ejs` — Added missing **Order** nav link.
  - `login.ejs` — Fixed invalid `style""` attribute.
  - `order.ejs` — Fixed invalid `style""` attribute.
- **Flash message consistency:** All pages use `bg-error-container` + `text-on-error-container` for errors and `bg-surface-container-high` + `text-primary` for successes.
- **Empty states:** Verified on orders, payments, admin-orders, product-detail, and recommendation pages.

### 5. Backend Compatibility Fix
- **`payment-service/middleware/upload.js`**
  - Added `application/pdf` to allowed MIME types.
  - Improved validation error message to list accepted formats (JPG, PNG, PDF).

### 6. Dependency Lockfile
- `frontend/package-lock.json` updated after installing/verifying dependencies (no new runtime deps added; lockfile synced with existing `package.json`).

### 7. Runtime Upload Directories Created
- `frontend/uploads/` — Local staging for payment proof uploads before proxying to the payment service.
- `payment-service/uploads/` — Destination for persisted payment proof files.

---

## Backend Assumptions Discovered

The frontend makes calls to the API Gateway using the following path conventions. These match the current backend service route definitions:

| Gateway Path | Method | Purpose |
|--------------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/products` | GET | List products |
| `/api/products/:id` | GET | Single product detail |
| `/api/orders` | GET / POST | List all / create order |
| `/api/orders/user/:userId` | GET | Orders for specific user |
| `/api/orders/:id/status` | PUT | Update order status |
| `/api/payments` | GET | List all payments |
| `/api/payments/order/:orderId` | GET | Payment for a specific order |
| `/api/payments/upload` | POST | Upload payment proof (multipart/form-data) |
| `/api/payments/:id/verify` | PUT | Verify a payment |
| `/api/gallery` | GET | Gallery items |
| `/api/recommendations` | GET | Recommendation items |

**Assumptions:**
- The user session object stored by the auth service contains at minimum: `{ id, email, nama, role }`.
- `role === 'admin'` is the exact string checked for admin privileges.
- The order service may return `{ orders: [...] }` or a plain array; the frontend normalizes both.
- The payment service may return `{ payments: [...] }` or a plain array; the frontend normalizes both.
- Payment upload endpoint expects a multipart `formData` containing `bukti_pembayaran` (file), `order_id`, `amount`, and `method`.

---

## Preserved Auth
- Login (`/login`) and register (`/register`) functionality was intentionally preserved.
- The only modification was replacing direct `axios.post` calls with `apiClient.post` (same request shape and response handling).
- No UX changes, validation changes, or session configuration changes were applied.

---

## Known Limitations / Open Items
- **Footer layouts:** Some pages (product-detail, orders, payments, admin-orders) use a minimal single-row footer while others use a full 4-column layout. Both are functional; a future polish pass could unify them.
- **Right-side auth action styling:** Login/register buttons on products/product-detail use button elements instead of text links (as seen on orders/payments). This is cosmetic and does not affect functionality.
- **Backend availability smoke tests:** While the frontend handles offline services gracefully at the code level, end-to-end integration tests (e.g., Cypress or Playwright) are not included in this pass.
- **Image CDN / static serving:** Payment proof thumbnails in the admin dashboard rely on the payment service serving uploaded files statically; if that is not configured, thumbnails will show the Material Symbols “broken image” icon (handled by existing `onerror` handler).

---

## Verification Commands Used During This Work
- `node frontend/app.js` + `curl -I http://localhost:3000/` → confirmed frontend starts and returns HTTP 200.
- `grep` verification across EJS views → confirmed nav links and HTML typo fixes were applied.
- Manual page-by-page EJS inspection → confirmed consistent flash messages, empty states, and form labels.
