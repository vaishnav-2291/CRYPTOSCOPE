# 🛡️ CryptoScope AI (v2.0)

### Enterprise Blockchain Intelligence & Deterministic Wallet Risk Platform

**CryptoScope AI** is a portfolio-grade Bitcoin blockchain risk analysis platform designed with a dark, cyber-fintech terminal aesthetic. It provides deterministic 5-axis heuristic risk scoring, interactive fund flow network graphing, multi-address batch scanning, known-entity intelligence, common-input clustering heuristics, and automated watchlist monitoring.

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([Security Analyst / User]) -->|HTTPS / REST API| Frontend[React 19 + Vite Frontend\nCyber-Fintech Terminal]
    Frontend -->|JWT Dual-Token Auth| ExpressApp[Express.js Gateway / Backend]

    subgraph Backend Engine
        ExpressApp --> RateLimiter[Rate Limiter & Address Validators]
        RateLimiter --> Cache[In-Memory TTL Cache Layer]
        Cache --> Controllers[Controllers: Wallet, Batch, Watchlist, Auth, Admin]
        Controllers --> RiskEngine[Deterministic 5-Axis Risk Engine]
        Controllers --> EntityService[Entity Intel & Common-Input Clustering]
        Controllers --> BlockchainAdapter[Multi-Chain Blockchain Provider]
    end

    BlockchainAdapter -->|Live Block Explorer API| MempoolSpace[(Mempool.space API)]
    BlockchainAdapter -->|Live Rates & Sparklines| CoinGecko[(CoinGecko Market API)]
    Controllers --> MongoDB[(MongoDB Database)]
```

---

## 🌟 Core Features

### 🔍 1. Multi-Dimensional Wallet Deep-Dive
- **Deterministic 5-Axis Risk Engine**: 100% explainable, rule-based heuristic scoring across:
  1. *Transaction Velocity Risk* (Max 25 pts)
  2. *Balance Concentration Risk* (Max 20 pts)
  3. *Fund Churn / Transit Pattern Risk* (Max 25 pts)
  4. *Activity & Temporal Consistency Risk* (Max 15 pts)
  5. *Entity & Sanctions Exposure Risk* (Max 35 pts)
- **Animated Speedometer Risk Gauge**: Radial SVG meter with 0–100 score and Low/Medium/High classification.
- **5-Axis Radar Chart**: Normalized exposure polygon comparing risk vectors.
- **Explainable Security Assessment**: Transparent rule audit detailing active rule IDs (e.g. `RULE-PAT-01`), exact metric thresholds, severity badges, and remediation advice.

### 🕸️ 2. Fund Flow Network Graph & Heuristics
- **Interactive Node-Link Graph**: SVG visualizer displaying target wallet, inbound counterparties, outbound destinations, and transaction weight routing with zoom/pan controls.
- **Known-Entity Tagging**: Curated registry matching exchange hot/cold wallets (Binance, Coinbase, Kraken), privacy mixers (Wasabi CoinJoin, Blender, ChipMixer), threat actors (WannaCry, Mt. Gox exploit), and mining pools.
- **Common-Input-Ownership Clustering**: UTXO co-signing heuristic linking sibling addresses co-spent in multi-input transactions.

### ⚡ 3. Batch Scanning & Multi-Wallet Comparison
- **Parallel Multi-Address Scanner**: Paste up to 20 Bitcoin addresses simultaneously with real-time progress tracking, consolidated risk comparison matrix, and one-click batch CSV export.
- **Side-by-Side Comparison Matrix**: Compare 2 to 4 wallets simultaneously with overlaid radar charts and metric comparison tables.

### 👁️ 4. Watchlist & Risk Deviation Alerts
- **Pinned Addresses**: Monitor target addresses with custom tags.
- **One-Click Re-Scan**: Detect score shifts (e.g. `+15 pts`) with in-app alert badges.

### 📄 5. Exporting & Public Sharing
- **Executive PDF Audit Report**: Generated via `jspdf` and `jspdf-autotable` with 5-axis breakdown, rule triggers, and transaction ledger.
- **CSV Ledger Export**: Full UTXO transaction history export.
- **Public Shareable Reports**: Read-only public URLs (`/report/:id`) accessible without login.

### 📈 6. Live Crypto Market & Sparklines
- **Real-Time Ticker**: CoinGecko live prices for BTC, ETH, and SOL with 24h change and interactive sparklines.
- **Verified Intelligence News**: Direct feed of blockchain cybersecurity dispatches.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Chart.js, React-ChartJS-2, Lucide React, jsPDF, jsPDF-AutoTable.
- **Backend**: Node.js, Express 5, MongoDB, Mongoose, Axios, bcrypt, jsonwebtoken, express-rate-limit.
- **Data Providers**: Mempool.space (Bitcoin Blockchain), CoinGecko (Market Telemetry).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v20+ recommended)
- MongoDB instance (local or MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/cryptoscope
JWT_SECRET=cryptoscope_super_secret_jwt_key_2026
GNEWS_API_KEY=optional_api_key_for_news
```

Start the backend server:
```bash
npm run dev
# or: node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit the app at `http://localhost:5173`.

---

## 🧪 Running Tests

CryptoScope AI includes automated unit tests for the deterministic risk engine and Bitcoin address format validators:

```bash
# From the project root:
node --test backend/tests/*.test.js
```

---

## 📑 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/wallet/:address` | Full single wallet analysis & risk score | Optional |
| `POST` | `/api/wallet/batch-scan` | Batch scan up to 20 addresses in parallel | Optional |
| `GET` | `/api/wallet/:address/transactions` | Paginated transactions (`after_txid`) | No |
| `GET` | `/api/wallet/:address/graph` | Node-link fund flow graph data | No |
| `GET` | `/api/wallet/:address/trend` | Historical risk score progression | No |
| `GET` | `/api/wallet/report/:id` | Public read-only scan report lookup | No |
| `GET` | `/api/wallet/watchlist` | Get user's pinned watchlist | Yes |
| `POST` | `/api/wallet/watchlist` | Add address to watchlist | Yes |
| `POST` | `/api/wallet/watchlist/rescan` | Re-scan watchlist & compute score deltas | Yes |
| `POST` | `/api/auth/register` | Register new user / admin account | No |
| `POST` | `/api/auth/login` | Login and obtain JWT tokens | No |
| `POST` | `/api/auth/refresh` | Refresh access token using refresh token | No |
| `GET` | `/api/crypto/market` | Live crypto prices & 7d sparkline | No |
| `GET` | `/api/admin/stats` | Platform-wide metrics & cache telemetry | Admin Only |

---

## ⚖️ License
ISC License © 2026 CryptoScope AI.
