# SmileOn Web — Revision Plan

## Issues Found

### 1. Payment Flow — "Pesanan tidak ditemukan" when uploading proof
- **Root cause:** `paymentController.js` line ~130 uses `ORDER_SERVICE_URL` but the variable is **never declared** in the file.
- **Secondary:** `uploadPayment` uses `API_GATEWAY` with `/api/orders/` path. In minikube this *can* work, but direct service-to-service is more reliable.
- **Fix:**
  - Declare `ORDER_SERVICE_URL` at top of `paymentController.js` with fallback chain: `process.env.ORDER_SERVICE_URL || process.env.API_GATEWAY || 'http://api-gateway'`.
  - Update `uploadPayment` to call `${ORDER_SERVICE_URL}/orders/${order_id}` (direct order-service path).
  - Update `verifyPayment` to call `${ORDER_SERVICE_URL}/orders/${payment.order_id}/status`.
  - Verify `.env` already has `ORDER_SERVICE_URL=http://order-service:3003`.

### 2. Price not showing on payment page
- Code already uses `order.total_harga` with `toLocaleString('id-ID')`. The "0" means `order` is `null` or `total_harga` is 0.
- Order creation sends `total_harga` from the JS calculator. The real fix is ensuring the order-service is reachable so `GET /orders/:id` returns the order.
- This is resolved by the same payment-controller fix above (improves overall inter-service reliability).

### 3. Currency already Rp
- Checked all views: `payment.ejs`, `order.ejs`, `orders.ejs`, `products.ejs`, `recommendation.ejs`, `payments.ejs`, `admin-orders.ejs` — all already use `Rp`.
- No action required.

### 4. UI Tab Navigation inconsistent
- User wants order: **Home | Gallery | Products | Recommendation | Order | My Orders**
- Current order in most views: Home | Gallery | **Recommendation | Products** | Order | My Orders (swapped).
- **Files to update nav order + active state:**
  - `frontend/views/home.ejs`
  - `frontend/views/order.ejs`
  - `frontend/views/payment.ejs`
  - `frontend/views/orders.ejs`
  - `frontend/views/products.ejs`
  - `frontend/views/gallery.ejs`
  - `frontend/views/recommendation.ejs`
  - `frontend/views/payments.ejs`
  - `frontend/views/admin-orders.ejs`
  - `frontend/views/login.ejs` (add full nav)
  - `frontend/views/register.ejs` (add full nav)

### 5. orders.ejs table column bug
- `<thead>` columns: Status, Total, Date, Action
- `<tbody>` renders: Total, Status, Date, Action (swapped).
- Swap the `<td>` blocks inside the loop to match header order.

### 6. Database schema — payment table optimization
- `payment_db.sql`: add `INDEX idx_order_id (order_id)` and `INDEX idx_user_id (user_id)`.
- `order_db.sql`: add `INDEX idx_user_id (user_id)` for order lookups.
- Add migration inserts to auto-init blocks in `payment-service/app.js` and `order-service/app.js`.

## Chunks

### Chunk A — payment-service fix
- **File:** `payment-service/controllers/paymentController.js`
- **Complexity:** simple
- **Changes:**
  1. Add `const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || process.env.API_GATEWAY || 'http://api-gateway';`.
  2. In `uploadPayment`, change axios call to `${ORDER_SERVICE_URL}/orders/${order_id}`.
  3. In `verifyPayment`, change axios call to `${ORDER_SERVICE_URL}/orders/${payment.order_id}/status`.
- **Verification:** `node -c paymentController.js` (syntax check). No tests to run easily.

### Chunk B — frontend views navigation consistency + orders.ejs fix
- **Files:** All `frontend/views/*.ejs` listed above.
- **Complexity:** simple (mechanical changes, many files).
- **Changes per view:**
  1. Reorder nav links to: Home → Gallery → Products → Recommendation → Order → My Orders.
  2. Ensure the current page has the active class `text-primary font-bold border-b-2 border-primary pb-1`.
  3. Ensure non-active pages have `text-on-surface-variant hover:text-primary`.
  4. In `login.ejs` and `register.ejs` add the full nav bar (currently minimal or missing).
  5. In `orders.ejs`, swap the `<td>` for Total and Status to match header order.
- **Verification:** Manual review of EJS syntax (no compilation needed).

### Chunk C — database schema + auto-init enhancements
- **Files:** `databases/payment_db.sql`, `databases/order_db.sql`, `payment-service/app.js`, `order-service/app.js`
- **Complexity:** simple
- **Changes:**
  1. Add `CREATE INDEX IF NOT EXISTS` statements to SQL files.
  2. Add same index creation to the auto-init blocks in app.js files, wrapped in try-catch so they are idempotent.
- **Verification:** SQL syntax check.

## Execution Order
- Chunk A → Chunk C → Chunk B (Chunk B is independent but best done last because it touches the most files).
