# Parental Legacy & Life Factors Calculator

A **full-stack MERN** (MongoDB · Express.js · React 19 · Node.js) web application that calculates and visualises seven core **Parental Legacy Life Factors** based on a user's Date of Birth.  The calculation engine is **100% deterministic**, always sums to exactly **100.000**, and follows odd/even day parity rules (odd days favour the Mother, even days favour the Father).

---

## ✨ Feature Set

| Category | Features |
|---|---|
| **Core Calculation** | Deterministic DOB-seeded PRNG · 7 Life Factors · Millipoint integer balancing guaranteeing grandTotal = 100.000 |
| **Authentication** | JWT (HS256) · bcrypt 12-round password hashing · Password strength enforcement · Guest → user history migration |
| **Database** | MongoDB via Mongoose · Paginated calculation history · Compound indexes · Soft guest session support |
| **Visualisations** | Grouped Bar Chart · Donut Chart · 7-Axis Radar Chart (Recharts) |
| **Exports** | PDF report (jsPDF) · CSV download |
| **UX / Design** | Dark / light mode (persisted) · Responsive mobile layout · Micro-animations · Glassmorphism cards |
| **Resilience** | Offline-first local calculation before server sync · In-memory MongoDB fallback in dev |

---

## 🏗 Architecture

```
┌──────────────────────────────────────┐
│            Browser (React 19)        │
│  Vite · TypeScript · Tailwind CSS   │
│  Recharts · Axios · jsPDF           │
└────────────────┬─────────────────────┘
                 │  HTTP (proxied /api → :5000)
┌────────────────▼─────────────────────┐
│          Express.js API (:5000)      │
│  Helmet · CORS · express-rate-limit  │
│  ├── /api/v1/auth  (JWT auth)        │
│  ├── /api/v1/calculate               │
│  └── /api/v1/history                 │
└────────────────┬─────────────────────┘
                 │  Mongoose ODM
┌────────────────▼─────────────────────┐
│          MongoDB                      │
│  (Atlas URI  OR  in-memory server)   │
│  Collections: users · calculations   │
└──────────────────────────────────────┘
```

---

## 📁 Project Structure

```
parental_legacy_and_life_factors_calculator/
├── package.json                # Root: concurrently run both servers
├── README.md                   # This file
│
├── server/                     # Node.js + Express + MongoDB Backend
│   ├── .env                    # Environment variables (git-ignored)
│   ├── .env.example
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── server.ts           # Express app entry point
│       ├── config/
│       │   ├── db.ts           # MongoDB connect (Atlas or in-memory)
│       │   └── env.ts          # Env helpers (JWT secret/expiry)
│       ├── models/
│       │   ├── User.ts         # Mongoose user schema
│       │   └── Calculation.ts  # Mongoose calculation schema
│       ├── services/
│       │   └── calculatorEngine.ts  # Pure deterministic engine
│       ├── middleware/
│       │   ├── authMiddleware.ts    # protect + optionalAuth JWT guards
│       │   └── errorHandler.ts     # Centralized error handler
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── calculateController.ts
│       │   └── historyController.ts
│       └── routes/
│           ├── authRoutes.ts
│           ├── calculateRoutes.ts
│           └── historyRoutes.ts
│
└── client/                     # React 19 + Vite + Tailwind CSS
    ├── index.html
    ├── vite.config.ts          # Dev proxy: /api → http://localhost:5000
    ├── tailwind.config.js
    └── src/
        ├── main.tsx            # Root: ThemeProvider > AuthProvider > App
        ├── App.tsx             # Main orchestrator (offline-first + server sync)
        ├── index.css
        ├── types/index.ts      # Shared TypeScript interfaces
        ├── context/
        │   ├── AuthContext.tsx # JWT auth state, login/register/logout
        │   └── ThemeContext.tsx # Dark/light mode
        ├── services/
        │   ├── api.ts          # Axios instance + all API calls
        │   ├── calculatorEngine.ts  # Client-side offline fallback engine
        │   ├── pdfExport.ts    # jsPDF report generator
        │   └── csvExport.ts    # CSV download utility
        └── components/
            ├── Navbar.tsx
            ├── DateInputCard.tsx
            ├── SummaryKpiCards.tsx
            ├── FactorTable.tsx
            ├── ChartsGrid.tsx
            ├── ExportActionBar.tsx
            ├── AuthModal.tsx
            └── HistoryModal.tsx
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- **MongoDB** (optional — falls back to in-memory server automatically in dev)

### 1. Clone & Install

```bash
git clone https://github.com/Sagarsangale01/parental_legacy_and_life_factors_calculator.git
cd parental_legacy_and_life_factors_calculator

# Install root dev dependency (concurrently)
npm install

# Install server + client dependencies
npm run install:all
```

### 2. Configure Environment

```bash
# server/.env is pre-configured for local dev.
# To use MongoDB Atlas, set MONGODB_URI:
```

Edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=                   # Leave empty for in-memory OR paste Atlas URI
JWT_SECRET=your_strong_secret_here_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Run (Development)

```bash
# From the project root — starts both servers concurrently:
npm run dev

# OR run individually:
cd server  && npm run dev    # API on http://localhost:5000
cd client  && npm run dev    # UI  on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔌 API Reference

All responses follow the envelope:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | — | Register a new user. Returns `{ token, user }` |
| `POST` | `/api/v1/auth/login` | — | Login. Returns `{ token, user }` |
| `GET`  | `/api/v1/auth/me` | Bearer JWT | Get current user profile + stats |
| `POST` | `/api/v1/auth/claim-guest-records` | Bearer JWT | Migrate guest calculations to account |

#### Register — Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass@1"
}
```
> Password rules: ≥ 8 chars, uppercase, lowercase, number, special character.

#### Login — Request Body
```json
{ "email": "jane@example.com", "password": "StrongPass@1" }
```

### Calculation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/calculate` | Optional JWT | Compute life factors for a DOB |

#### Request Body
```json
{
  "dob": "1995-03-15",
  "save": true,
  "guestSessionId": "guest_abc123"
}
```

#### Response Sample
```json
{
  "success": true,
  "data": {
    "id": "6aace74c...",
    "dob": "1995-03-15",
    "dayOfMonth": 15,
    "isOddDay": true,
    "dominantParent": "Mother",
    "motherTotal": 51.692,
    "fatherTotal": 48.308,
    "grandTotal": 100,
    "factors": [
      {
        "factorId": "genetic_inheritance",
        "factorName": "Genetic Inheritance",
        "motherValue": 10.273,
        "fatherValue": 9.641,
        "totalValue": 19.914,
        "min": 9.333,
        "max": 10.777,
        "higherParent": "Mother"
      }
      // ...6 more factors
    ],
    "calculatedAt": "2026-09-18T07:24:24.566Z"
  }
}
```

### History

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET`    | `/api/v1/history` | JWT or guestSessionId | Paginated calculation history |
| `GET`    | `/api/v1/history/:id` | JWT or guestSessionId | Single calculation detail |
| `GET`    | `/api/v1/history/:id/csv` | JWT or guestSessionId | Download result as CSV (owner or matching guest session) |
| `DELETE` | `/api/v1/history/:id` | JWT | Delete a calculation (owner only — 403 otherwise) |

---

## 🔐 Security Implementation

| Concern | Implementation |
|---|---|
| Password hashing | `bcryptjs` with 12 salt rounds |
| JWT signing | HS256, configurable expiry (default 7 days) |
| Token transport | `Authorization: Bearer <token>` header only |
| Password policy | Regex: min 8 chars · uppercase · lowercase · number · special char |
| Rate limiting | `express-rate-limit` on all auth routes |
| HTTP headers | `helmet` sets `X-Frame-Options`, `CSP`, `HSTS` etc. |
| CORS | Explicit allow-list (`CLIENT_URL` env var) |
| Secrets | All secrets in `.env` — never hardcoded |
| Input validation | Server-side validation on every endpoint |
| Error exposure | Generic messages only — no stack traces in responses |

---

## 🧮 Calculation Engine Rules

The engine in `server/src/services/calculatorEngine.ts` implements these invariants:

1. **Determinism** — same DOB always produces the same result (seeded PRNG).
2. **Parity Rule** — Odd day of month → Mother Total > Father Total · Even day → Father Total > Mother Total.
3. **Per-Factor Rule** — `motherValue + fatherValue = totalValue` for every factor.
4. **Grand Total Invariant** — `motherTotal + fatherTotal = 100.000` exactly (millipoint integer balancing prevents IEEE 754 drift).
5. **Factor Bounds** — every Mother and Father value per factor stays within its `[min, max]` range from the reference spreadsheet.

### Life Factors (reference ranges)

| Factor | Min | Max |
|--------|-----|-----|
| Genetic Inheritance | 9.333 | 10.777 |
| Constitutional Vitality | 8.111 | 9.111 |
| Mental Patterns | 6.111 | 7.111 |
| Intellectual Capacity | 6.333 | 6.999 |
| Emotional Foundation | 7.111 | 7.999 |
| Spiritual Lineage | 5.011 | 6.011 |
| Soul Connections | 5.111 | 6.222 |

---

## 🧪 Running Tests

```bash
# Server unit tests (Vitest)
cd server
npm test
```

Tests cover:
- 366-day leap year sweep: `sum(mother) + sum(father) === 100.000` for every day
- Determinism: 100 identical DOBs produce identical output
- Parity: odd days give Mother > Father; even days give Father > Mother
- Factor bounds compliance

---

## 🌐 Deployment

### Production Build

```bash
# Build server TypeScript
cd server && npm run build

# Build client
cd client && npm run build
```

### Environment — Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/parental_legacy
JWT_SECRET=<64-char-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-frontend-domain.com
```

### Recommended Platforms

| Layer | Platform |
|---|---|
| Frontend | Vercel / Netlify |
| Backend API | Render / Railway / Fly.io |
| Database | MongoDB Atlas (free M0 tier) |

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS |
| Charts | Recharts |
| Export | jsPDF · jsPDF-AutoTable |
| Backend | Node.js · Express.js · TypeScript |
| Database | MongoDB · Mongoose ODM |
| Auth | JSON Web Tokens (`jsonwebtoken`) · `bcryptjs` |
| Dev DB | `mongodb-memory-server` (zero-config local) |
| Security | `helmet` · `cors` · `express-rate-limit` |
| Dev Tools | `tsx` · `concurrently` · Vitest |

---

## 📄 License

MIT — for assessment / educational purposes.
