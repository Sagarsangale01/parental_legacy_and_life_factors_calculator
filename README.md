# Parental Legacy & Life Factors Calculator

[![Live AWS Deployment](https://img.shields.io/badge/Live_AWS_Demo-54.175.61.114-success?style=for-the-badge&logo=amazon-aws&color=059669)](http://54.175.61.114)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-blue?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Cloud-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)

A **full-stack enterprise MERN** (MongoDB · Express.js · React 19 · Node.js) web application that calculates and visualises seven core **Parental Legacy Life Factors** based on a user's Date of Birth (DOB). The calculation engine is **100% deterministic**, always sums to exactly **100.000**, and follows odd/even day parity rules (odd days favour the Mother, even days favour the Father).

---

## 🌐 Live AWS Production Deployment

The application is deployed on **100% AWS Free Tier Infrastructure ($0/month)**:

- 🔗 **Live Web Application URL:** [http://54.175.61.114](http://54.175.61.114)
- ☁️ **Host:** AWS EC2 (`t3.micro` / `t2.micro` - Ubuntu 24.04 LTS + Docker Host Networking + 2 GB Swap)
- 🍃 **Database:** MongoDB Atlas M0 Shared Cluster (AWS Region)
- 🐳 **Containerization:** Multi-stage production Docker container with Nginx & Express.js runner.

---

## ✨ Feature Set

| Category | Features & Capabilities |
|---|---|
| **Core Calculation** | Deterministic DOB-seeded Mulberry32 PRNG · 7 Life Factors · Millipoint integer balancing guaranteeing grandTotal = 100.000 |
| **Authentication** | JWT (HS256) · bcrypt 12-round password hashing · Password strength enforcement · Guest → user history claim migration |
| **Database** | MongoDB via Mongoose · Paginated calculation history · Compound indexes · Soft guest session support |
| **Visualisations** | Grouped Bar Chart · Donut Split with high-contrast center badge · 7-Axis Radar Profile (Recharts) |
| **PDF Export** | Vector PDF report generator (`jsPDF` + `jspdf-autotable`) with executive layout, metrics & table |
| **CSV Export** | RFC 4180 CSV export utility on client and server (`GET /api/v1/history/:id/csv`) |
| **Dark/Light Theme** | Persistent dark/light mode toggle adapting all card backgrounds, typography, and chart SVG colors |
| **Resilience** | Offline-first client calculation for instant 0ms preview before backend cloud sync · In-memory MongoDB fallback in dev |

---

## 🏗 Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Frontend (React 19 SPA)                          │
│                  Vite · TypeScript · Tailwind CSS · Recharts                │
│                     jsPDF · Axios · Lucide Icons                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST API (Port 80 / 5000)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                        Express.js Backend API Server                        │
│                 Node.js 20 · Helmet · CORS · Rate-Limiter                   │
│  ├── /api/v1/auth         (Register, Login, Me, Claim Guest Records)        │
│  ├── /api/v1/calculate    (Pure Deterministic PRNG & Millipoint Balance)   │
│  └── /api/v1/history      (Paginated MongoDB Queries & CSV Export)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Mongoose ODM Driver
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                               MongoDB Database                              │
│              MongoDB Atlas Cloud  OR  In-Memory Dev Fallback               │
│               Collections: `users` (Index) · `calculations`                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧮 Mathematical Engine & Reference Bounds

The engine (`server/src/services/calculatorEngine.ts` & `client/src/services/calculatorEngine.ts`) satisfies these mathematical invariants:

1. **Determinism:** Seed derived from DOB: `(Year * 10000) + (Month * 100) + Day` via Mulberry32 PRNG.
2. **Parity Dominance Rule:**
   - **Odd Days of Month** (1, 3, 5, ..., 31): $\text{Mother Total} > \text{Father Total}$
   - **Even Days of Month** (2, 4, 6, ..., 30): $\text{Father Total} > \text{Mother Total}$
3. **Factor Level Invariant:** $\text{Mother Value}_i + \text{Father Value}_i = \text{Total Value}_i$ for every factor $i \in \{1..7\}$.
4. **Grand Total Invariant:** $\sum \text{Mother} + \sum \text{Father} = 100.000$ exactly (Integer millipoint arithmetic eliminates IEEE 754 precision drift).
5. **Boundary Compliance:** All calculated values stay strictly within the authoritative bounds:

| # | Life Factor | Minimum Bound | Maximum Bound | Range ($\Delta$) |
|---|---|:---:|:---:|:---:|
| 1 | **Genetic Inheritance** | 9.333 | 10.777 | 1.444 |
| 2 | **Constitutional Vitality** | 8.111 | 9.111 | 1.000 |
| 3 | **Mental Patterns** | 6.111 | 7.111 | 1.000 |
| 4 | **Intellectual Capacity** | 6.333 | 6.999 | 0.666 |
| 5 | **Emotional Foundation** | 7.111 | 7.999 | 0.888 |
| 6 | **Spiritual Lineage** | 5.011 | 6.011 | 1.000 |
| 7 | **Soul Connections** | 5.111 | 6.222 | 1.111 |
| **TOTAL** | **Sum of 7 Factors** | **47.121** | **54.230** | **7.109** |

---

## 📁 Project Directory Structure

```
parental_legacy_and_life_factors_calculator/
├── Dockerfile                  # Multi-stage production Docker container
├── docker-compose.yml          # Container orchestration (Host Network Mode)
├── nginx.conf                  # Nginx reverse proxy configuration
├── package.json                # Root package configuration
├── README.md                   # Project documentation
│
├── server/                     # Node.js + Express.js + MongoDB Backend
│   ├── .env.example            # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── tests/
│   │   └── calculatorEngine.test.ts # Vitest suite (10/10 passed)
│   └── src/
│       ├── server.ts           # Express entry point & static asset handler
│       ├── config/             # DB connection & env validators
│       ├── controllers/        # Auth, calculate, and history controllers
│       ├── middleware/         # JWT authentication & error handlers
│       ├── models/             # Mongoose `User` and `Calculation` schemas
│       ├── routes/             # Modular API endpoints
│       └── services/           # Deterministic PRNG calculation engine
│
├── client/                     # React 19 + Vite + Tailwind CSS Frontend
│   ├── package.json
│   ├── vite.config.ts          # Dev proxy (/api -> http://localhost:5000)
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # Main dashboard orchestrator
│       ├── context/            # AuthContext & ThemeContext
│       ├── services/           # Axios API, offline engine, PDF & CSV exporters
│       └── components/         # Navbar, DateInputCard, SummaryKpiCards,
│                               # FactorTable, ChartsGrid, ExportActionBar,
│                               # AuthModal, HistoryModal
└── docs/                       # PRD and AWS deployment documentation
    ├── PRD.md
    └── AWS_FREE_TIER_DEPLOYMENT.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** v18+
- **npm** v9+
- **MongoDB** (Optional — automatically falls back to `mongodb-memory-server` in dev)

### 1. Clone Repository & Install Dependencies

```bash
git clone https://github.com/Sagarsangale01/parental_legacy_and_life_factors_calculator.git
cd parental_legacy_and_life_factors_calculator

# Install root dependencies
npm install

# Install server and client dependencies in parallel
npm run install:all
```

### 2. Configure Environment Variables

Create or edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=                  # Leave empty for in-memory DB or paste MongoDB Atlas URI
JWT_SECRET=dev_super_secret_jwt_key_12345
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Server

```bash
# Starts Express backend (:5000) and Vite frontend (:5173) concurrently:
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 🧪 Running Unit Tests

```bash
# Run Vitest suite for calculator engine invariants
npm run test:server
```

### Test Coverage Highlights:
- ✅ **366-day leap year sweep:** Validates `grandTotal === 100.000` for every day.
- ✅ **100% Determinism:** Verified identical outputs across repeated runs for same DOB.
- ✅ **Parity Dominance:** Verifies Mother > Father on odd days; Father > Mother on even days.
- ✅ **Factor Bounds:** Verifies every value stays within $[Min_i, Max_i]$ bounds.

---

## 🐳 Docker & AWS EC2 Free Tier Deployment

To deploy on **AWS EC2 (`t3.micro` / `t2.micro`)** for **$0/month**:

### 1. SSH into EC2 Instance
```bash
ssh -i "your-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

### 2. Enable 2 GB Swap Space (Prevents memory lock on 1 GB RAM)
```bash
sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Launch Docker Container
```bash
git clone https://github.com/Sagarsangale01/parental_legacy_and_life_factors_calculator.git
cd parental_legacy_and_life_factors_calculator

# Configure .env with MongoDB Atlas URI
nano .env

# Build and start container in background
docker compose up -d --build
```

Access your app at **`http://YOUR_EC2_PUBLIC_IP`**!

---

## 🔌 API Reference

All REST endpoints return standardized JSON envelopes:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register user account `{ token, user }` |
| `POST` | `/api/v1/auth/login` | Public | Login `{ token, user }` |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Get authenticated profile & calculation stats |
| `POST` | `/api/v1/auth/claim-guest-records` | Bearer JWT | Claim guest calculations to logged-in user |

### Calculation & History Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/calculate` | Optional JWT | Compute life factors for DOB & store record |
| `GET` | `/api/v1/history` | JWT / Guest ID | Paginated calculation history |
| `GET` | `/api/v1/history/:id` | JWT / Guest ID | Get single calculation record |
| `GET` | `/api/v1/history/:id/csv` | JWT / Guest ID | Download calculation result as CSV |
| `DELETE` | `/api/v1/history/:id` | Bearer JWT | Delete calculation (owner only) |

---

## 📄 License

MIT — Created for Assessment & Educational Purposes.
