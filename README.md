# Finance Data Processing and Access Control Backend

A production-quality REST API backend for a finance dashboard system, built with **Node.js + Express + SQLite (sql.js)**. Implements user/role management, financial records CRUD, dashboard analytics, JWT authentication, and RBAC access control.

---

## Tech Stack

| Layer        | Choice              | Reason                                              |
|--------------|---------------------|-----------------------------------------------------|
| Runtime      | Node.js 18+         | Async I/O, great ecosystem for REST APIs            |
| Framework    | Express 4           | Minimal, composable, industry standard              |
| Database     | sql.js (SQLite)     | Pure-JS SQLite — zero native deps, easy to run      |
| Auth         | JWT (jsonwebtoken)  | Stateless, easy to verify across services           |
| Passwords    | bcryptjs            | Industry-standard password hashing                 |
| Validation   | express-validator   | Declarative, composable input validation            |
| Security     | helmet, rate-limit  | HTTP header hardening + brute force protection      |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── app.js                  # Express server entry point
│   ├── database.js             # SQLite connection, schema init, helpers
│   ├── seed.js                 # Seed script (users + sample records)
│   ├── controllers/
│   │   ├── authController.js   # Login, /me
│   │   ├── userController.js   # User CRUD
│   │   ├── recordController.js # Financial record CRUD
│   │   └── dashboardController.js # Analytics endpoints
│   ├── services/
│   │   ├── authService.js      # login(), createUser() business logic
│   │   ├── userService.js      # listUsers(), updateUser(), etc.
│   │   ├── recordService.js    # createRecord(), listRecords(), etc.
│   │   └── dashboardService.js # getSummary(), getInsights(), trends
│   ├── middleware/
│   │   ├── auth.js             # authenticate() + authorize() middleware
│   │   ├── validate.js         # express-validator result handler
│   │   └── errorHandler.js     # Global error + 404 handlers
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   └── utils/
│       ├── constants.js        # ROLES, PERMISSIONS, CATEGORIES
│       └── response.js         # Uniform API response helpers
├── tests/
│   └── run.js                  # 51-test integration test suite
├── .env
└── package.json
```

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Seed the database (creates users + 30 sample records)
```bash
npm run seed
```

### 3. Start the server
```bash
npm start
# or with file-watching:
npm run dev
```

Server starts at: `http://localhost:3000`

### 4. Run tests
```bash
npm test
```

---

## Credentials (after seeding)

| Role    | Email                   | Password       |
|---------|-------------------------|----------------|
| Admin   | admin@finance.dev       | Admin@1234     |
| Analyst | analyst@finance.dev     | Analyst@1234   |
| Viewer  | viewer@finance.dev      | Viewer@1234    |

---

## API Reference

All endpoints return a consistent envelope:
```json
{ "success": true, "message": "...", "data": {...}, "meta": {...} }
```

### Authentication

| Method | Path             | Auth | Description              |
|--------|------------------|------|--------------------------|
| POST   | /api/auth/login  | No   | Login, get JWT token     |
| GET    | /api/auth/me     | Yes  | Get current user info    |

**Login request:**
```json
POST /api/auth/login
{ "email": "admin@finance.dev", "password": "Admin@1234" }
```

**Login response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "...", "name": "Admin User", "role": "admin", ... }
  }
}
```

Use the token as: `Authorization: Bearer <token>`

---

### Users (Admin only)

| Method | Path           | Description                         |
|--------|----------------|-------------------------------------|
| GET    | /api/users     | List users (filter: role, status)   |
| POST   | /api/users     | Create a new user                   |
| GET    | /api/users/:id | Get user by ID                      |
| PATCH  | /api/users/:id | Update user (name/email/role/status)|
| DELETE | /api/users/:id | Deactivate user (soft delete)       |

**Query params for GET /api/users:** `role`, `status`, `page`, `limit`

---

### Financial Records

| Method | Path             | Roles Allowed        | Description                    |
|--------|------------------|----------------------|--------------------------------|
| GET    | /api/records     | viewer, analyst, admin | List records with filters    |
| POST   | /api/records     | admin only           | Create a record                |
| GET    | /api/records/:id | viewer, analyst, admin | Get a record by ID           |
| PATCH  | /api/records/:id | admin only           | Update a record                |
| DELETE | /api/records/:id | admin only           | Soft-delete a record           |

**Query params for GET /api/records:**
- `type` — `income` or `expense`
- `category` — one of the supported categories
- `startDate` / `endDate` — ISO8601 date filter (YYYY-MM-DD)
- `search` — search in notes or category
- `page`, `limit` — pagination
- `sortBy` — `date`, `amount`, `category`, `type`, `created_at`
- `sortDir` — `ASC` or `DESC`

**Create record body:**
```json
{
  "amount": 5000.00,
  "type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "notes": "April salary"
}
```

**Supported categories:**
`salary`, `freelance`, `investment`, `rent`, `utilities`, `food`, `transport`, `healthcare`, `entertainment`, `shopping`, `education`, `insurance`, `tax`, `other`

---

### Dashboard

| Method | Path                          | Roles              | Description                         |
|--------|-------------------------------|--------------------|-------------------------------------|
| GET    | /api/dashboard/summary        | All roles          | Total income, expenses, net balance |
| GET    | /api/dashboard/categories     | All roles          | Category-wise income/expense totals |
| GET    | /api/dashboard/trends/monthly | All roles          | Monthly income vs expense trend     |
| GET    | /api/dashboard/trends/weekly  | All roles          | Weekly trend                        |
| GET    | /api/dashboard/activity       | All roles          | Recent transactions                 |
| GET    | /api/dashboard/insights       | analyst, admin     | Deep analytics (ratios, averages)   |

**Summary response:**
```json
{
  "data": {
    "total_income": 510000,
    "total_expenses": 185400,
    "net_balance": 324600,
    "record_count": 30
  }
}
```

**Insights response (analyst/admin only):**
```json
{
  "data": {
    "average_income_per_transaction": 51000.00,
    "average_expense_per_transaction": 5745.00,
    "income_to_expense_ratio": 2.75,
    "savings_rate_percent": 63.65,
    "top_expense_categories": [...],
    "top_income_categories": [...]
  }
}
```

**Date filter (optional, for summary/categories/insights):**
`?startDate=2026-01-01&endDate=2026-03-31`

---

## Access Control Matrix

| Action              | Viewer | Analyst | Admin |
|---------------------|--------|---------|-------|
| Read records        | ✅     | ✅      | ✅    |
| Create record       | ❌     | ❌      | ✅    |
| Update record       | ❌     | ❌      | ✅    |
| Delete record       | ❌     | ❌      | ✅    |
| View dashboard      | ✅     | ✅      | ✅    |
| View insights       | ❌     | ✅      | ✅    |
| Manage users        | ❌     | ❌      | ✅    |

---

## Security Features

- **JWT Authentication** — 24h expiry, signed with HS256
- **Bcrypt Password Hashing** — 10 salt rounds
- **Role-Based Access Control** — Permission matrix enforced at middleware layer
- **Input Validation** — All inputs validated with express-validator before hitting services
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **Helmet** — Secure HTTP headers
- **Soft Deletes** — Records and users are never hard-deleted
- **SQL Injection Prevention** — All queries use parameterised statements

---

## Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" }
  ]
}
```

| Status | Meaning                    |
|--------|----------------------------|
| 200    | OK                         |
| 201    | Created                    |
| 400    | Validation / bad request   |
| 401    | Not authenticated          |
| 403    | Forbidden (wrong role)     |
| 404    | Resource not found         |
| 409    | Conflict (duplicate email) |
| 429    | Rate limit exceeded        |
| 500    | Internal server error      |


## Assumptions & Design Decisions

1. **sql.js over a hosted DB** — Chosen for zero-setup local development. The database layer is fully isolated in `src/database.js`; swapping to PostgreSQL/MySQL requires only changing that one file.

2. **Soft deletes everywhere** — Both users (set to `inactive`) and records (set `deleted = 1`) are never hard-deleted. This preserves data integrity and provides an audit trail.

3. **Records belong to users** — Every financial record stores `user_id`. The current listing API shows all records to authenticated users of any role (simulating a shared company ledger). This is a documented assumption; per-user scoping can be added with a single WHERE clause.

4. **Flat RBAC** — Three roles (viewer, analyst, admin) are enforced via a central permission matrix in `constants.js`. Adding a new permission or role requires only editing that one file.

5. **JWT is stateless** — No token revocation/blacklist is implemented. For production, add a Redis-backed token blocklist or use short expiry + refresh tokens.

6. **Pagination defaults** — Default page size is 20, hard-capped at 100 to prevent accidental full-table scans.

7. **Amount validation** — Amounts must be positive floats. The `type` field (income/expense) carries the sign semantics.


