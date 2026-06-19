# Code Review — SmileOn Web Revision

## Verdict: NEEDS_FIXES

---

## Issues

### 1. MySQL does not support `CREATE INDEX IF NOT EXISTS`

**File:** `databases/payment_db.sql`, line 31
```
CREATE INDEX IF NOT EXISTS idx_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON payments(user_id);
```

**File:** `databases/order_db.sql`, line 30
```
CREATE INDEX IF NOT EXISTS idx_user_id ON orders(user_id);
```

**Problem:** MySQL (including MySQL 8.0 and MariaDB) does not support the `IF NOT EXISTS` clause for `CREATE INDEX`. This syntax is valid only in PostgreSQL. When these SQL files are executed against the MySQL database, both `CREATE INDEX` statements will produce a syntax error. Note that the auto-init blocks in `app.js` use the same syntax via `pool.query()`, so those will also fail silently (caught by the try-catch, but the indexes will not be created).

**Suggested fix:** Remove the `IF NOT EXISTS` from `CREATE INDEX` statements in both SQL files and both `app.js` auto-init blocks. The table creation is already wrapped in `CREATE TABLE IF NOT EXISTS`, so the indexes can safely be created after — if the table already exists, re-creating indexes on it will just succeed or be a no-op if no changes. Alternatively, use a stored procedure or conditional query pattern compatible with MySQL.

---

### 2. Three pages missing active state on navbar links

**File:** `frontend/views/login.ejs`
**File:** `frontend/views/register.ejs`
**File:** `frontend/views/admin-orders.ejs`

**Problem:** All three files now have the full navbar added (per the plan), but none of the nav links have the active state styling (`text-primary font-bold border-b-2 border-primary pb-1`). Every other page in the project (`home`, `gallery`, `products`, `recommendation`, `order`, `payment`, `orders`, `payments`, `product-detail`) correctly highlights the current page. These three pages have all nav links using `text-on-surface-variant hover:text-primary` without any active link.

For `login.ejs` and `register.ejs`, "Login" should be the active link. For `admin-orders.ejs`, there is no clear "admin" tab in the nav, so either no link should be active (consistent with minimal admin-only pages) or the active link choice needs a design decision — but it should not silently differ from the rest of the site.

**Suggested fix:**
- In `login.ejs`: add `text-primary font-bold border-b-2 border-primary pb-1` to the Login `<a>` tag and remove it from the non-active links.
- In `register.ejs`: add the same active class to the Register `<a>` tag.
- In `admin-orders.ejs`: decide on the active link convention for admin pages and apply consistently.

---

### 3. Unused variable `API_GATEWAY` in paymentController.js

**File:** `payment-service/controllers/paymentController.js`, line 27
```
const API_GATEWAY = process.env.API_GATEWAY || 'http://api-gateway';
```

**Problem:** `API_GATEWAY` is declared on line 27 but never used anywhere in the file. `ORDER_SERVICE_URL` is used consistently instead (lines 44, 73, 101, 116). This is dead code that could confuse future maintainers.

**Suggested fix:** Remove line 27. The fallback chain for `ORDER_SERVICE_URL` already includes `process.env.API_GATEWAY` as a fallback, so no functionality is lost.

---

### 4. `payment.ejs` — "My Orders" is highlighted as active on a payment page

**File:** `frontend/views/payment.ejs`, nav section

**Problem:** On the `/payment` page, the navbar highlights "My Orders" as active (via `text-primary font-bold border-b-2 border-primary pb-1`). This is the same pattern used on `orders.ejs` itself. However, `payment.ejs` was not listed in the plan as needing a nav order fix or active state change. The current active link (`My Orders`) seems arbitrary for a payment confirmation page. Other payment-related pages (e.g., `orders.ejs`) correctly highlight the relevant section.

**Suggested fix:** Either confirm this is intentional, or change the active link on `payment.ejs` to "Order" (since the page is accessed via an order flow). At minimum, document the rationale.

---

### 5. `home.ejs` — brand logo link not highlighted when on home page

**File:** `frontend/views/home.ejs`, nav section, brand logo `<a>` tag

**Problem:** Every other page links the brand "SmileOn Lab" logo without any active styling. On `home.ejs` itself, the brand logo link has the full active classes: `text-primary font-bold border-b-2 border-primary`. This is inconsistent — the brand logo on the home page should match the style of brand logo links on all other pages (i.e., no active border styling). All content nav links on `home.ejs` correctly show "Home" as active, so the brand logo active style is redundant.

**Suggested fix:** Remove `text-primary font-bold border-b-2 border-primary` from the brand logo `<a>` tag in `home.ejs`, making it match all other pages' logo link style: `text-primary hover:opacity-80 transition` or similar.

---

## Summary

| Area | Status |
|---|---|
| `ORDER_SERVICE_URL` declared and used in both functions | PASS |
| Axios calls use direct order-service URL (no API Gateway path) | PASS |
| SQL index statements idempotent (wrapped in try-catch in app.js) | PASS |
| All EJS navbars have identical link order | PASS |
| `orders.ejs` table body columns match header order | PASS |
| No broken HTML/EJS structural tags (verified spot-checks) | PASS |
| Currency consistently `Rp` in all views | PASS |
| `.env` has `ORDER_SERVICE_URL=http://order-service:3003` | PASS |
| All JS syntax checks pass (`node -c`) | PASS |
| MySQL `CREATE INDEX IF NOT EXISTS` syntax compatibility | FAIL |
| All navbars have correct active link state | PARTIAL |
| Unused variable cleanup | FAIL |

**Critical:** Issue #1 will cause index creation to fail on MySQL/MariaDB. Issues #2 reduces UI consistency. Issues #3 and #5 are minor cleanup.