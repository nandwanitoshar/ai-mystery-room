# AI Mystery Room

An immersive, full-stack AI-powered mystery investigation game built with React, Node.js, Express, MongoDB Atlas, and Google Gemini API (`@google/genai`).

---

## Prerequisites

Before running this project, ensure you have the following installed on your machine:
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **MongoDB Atlas Account:** Active cluster with a configured database user and IP access list
- **Google AI Studio API Key:** (Required for mystery generation in subsequent phases)

---

## Project Structure

```
ai_mastery_room/
├── SPEC.md            # Comprehensive technical architecture & specification
├── README.md          # Project documentation & setup instructions
├── .gitignore         # Git ignore rules for node_modules, build outputs, and env files
│
├── client/            # Frontend application (React + Vite + Tailwind CSS)
│   ├── public/        # Static public assets
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx           # Top navigation bar
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # / (Home)
│   │   │   ├── CreatePage.jsx       # /create (Mystery creation)
│   │   │   ├── InvestigationPage.jsx# /case/:id (Investigation room)
│   │   │   ├── AccusationPage.jsx   # /case/:id/accuse (Accusation interface)
│   │   │   └── ResultsPage.jsx      # /case/:id/result (Results debrief)
│   │   ├── App.jsx                  # React Router configuration
│   │   ├── index.css                # Tailwind CSS import
│   │   └── main.jsx                 # Client entry point
│   ├── .env.example                 # Frontend environment template
│   ├── package.json
│   └── vite.config.js               # Vite & Tailwind configuration
│
└── server/            # Backend API (Node.js + Express + Mongoose)
    ├── src/
    │   ├── config/
    │   │   └── db.js                # Reusable Mongoose MongoDB connection module
    │   ├── models/
    │   │   └── Case.js              # Mongoose Case model with solution concealment
    │   ├── app.js                   # Express application setup, CORS, health endpoint
    │   └── server.js                # Server entry point & listener
    ├── .env.example                 # Backend environment template (safe placeholders)
    └── package.json
```

---

## MongoDB Atlas Configuration Guide

Follow these steps to configure your MongoDB Atlas database:

1. **Create an Atlas Cluster:**
   - Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Create a free shared cluster (e.g., `M0 Sandbox`).

2. **Configure Network Access (IP Whitelist):**
   - In the left sidebar under **Security**, navigate to **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) for local development, or add your current IP address.
   - Click **Confirm**.

3. **Create a Database User:**
   - In the left sidebar under **Security**, navigate to **Database Access**.
   - Click **Add New Database User**.
   - Choose **Password** authentication method.
   - Set a username (e.g. `mystery_room_user`) and a secure password.
   - Under **Database User Privileges**, select **Read and write to any database**.
   - Click **Add User**.
   - > [!IMPORTANT]
     > If your password contains special characters such as `@`, `:`, `/`, or `%`, ensure they are URL-encoded in the connection string (e.g. `@` becomes `%40`).

4. **Obtain Connection String:**
   - Under **Deployments**, click **Database**.
   - Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy the connection string format:
     ```text
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ai_mystery_room?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.
   - Place this string into `server/.env` under `MONGODB_URI`.

---

## Installation

### 1. Backend Dependencies
```bash
cd server
npm install
```

### 2. Frontend Dependencies
```bash
cd ../client
npm install
```

---

## Environment Variables

### Backend (`server/.env`)
Copy the example file:
```bash
cd server
cp .env.example .env
```

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Allowed client origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `GEMINI_MODEL` | Configurable Gemini model identifier | `gemini-2.5-flash` |

### Frontend (`client/.env`)
Copy the example file:
```bash
cd client
cp .env.example .env
```

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL pointing to the backend API | `http://localhost:5000/api` |

---

## Development Mode

Run the backend and frontend in separate terminals.

### Start Backend Server
```bash
cd server
npm run dev
```
*The Express server connects to MongoDB and runs at `http://localhost:5000` with hot-reloading via `nodemon`.*
*Health check URL: `http://localhost:5000/api/health`*

### Start Frontend Client
```bash
cd client
npm run dev
```
*The Vite development server runs at `http://localhost:5173`.*

---

## Health Check Endpoint

Query `GET /api/health` to verify server and database connectivity:
```bash
curl http://localhost:5000/api/health
```

Example response:
```json
{
  "status": "ok",
  "message": "AI Mystery Room backend is running",
  "database": "connected",
  "timestamp": "2026-10-29T13:15:00.000Z"
}
```

---

## Running Automated Tests

### 1. Backend Unit & Integration Tests (Phase 3B + Phase 3C)
```bash
cd server
npm test
```
*Executes all 28 backend tests covering schema validation, secret concealment, MongoDB Atlas persistence, clue discovery, hint limits, accusation calculation, and completed-case security.*

### 2. End-to-End Real Browser Automation (Phase 3D)
```bash
cd server
node tests/e2e_browser.test.js
```
*Drives Google Chrome via Puppeteer to test Home, Case Creation (Easy, Medium, Hard), Evidence discovery, Hint modal deductions, Accusations, Results debrief, and error states.*

### 3. Frontend Production Build
```bash
cd client
npm run build
```

## Phase Status

- [x] **Phase 1:** Planning and Master Specification (`SPEC.md`)
- [x] **Phase 2:** Project Setup, Dependencies, Routing & Health Check
- [x] **Phase 3A:** MongoDB Connection, Case Model & Backend Foundation
- [x] **Phase 3B:** Gemini AI SDK Integration, Mystery Generation & POST /api/cases
- [x] **Phase 3C:** Complete Investigation Gameplay, Endpoints & Frontend UI
- [x] **Phase 3D:** End-to-End Browser Verification & Automated Validation
- [ ] **Phase 4:** Production Polish, Audio/Visual Atmosphere & Final Deployment
