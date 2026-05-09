# Rate-Limited API Access Management System
### FSD Assignment – 46

A full-stack system that enforces database-backed API rate limiting with role-based access control.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Vercel (frontend), Render (backend) |

---

## User Roles & Permissions

### USER
- Register / Login
- Access protected APIs (`GET /api/protected/data`, `GET /api/protected/resource`)
- View own request history and usage stats

### ADMIN
- Register / Login
- Create, edit, activate/deactivate, delete rate limit rules
- View per-user usage summary
- View all API request logs (paginated)

---

## Project Structure

```
rate-limiter/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (bcrypt hashed password)
│   │   ├── RateLimit.js     # Rate limit rule schema
│   │   └── ApiUsage.js      # Per-request tracking schema
│   ├── middleware/
│   │   ├── auth.js          # JWT verify + role guard
│   │   └── rateLimit.js     # DB-backed rate limit enforcement
│   ├── routes/
│   │   ├── auth.js          # /api/auth — register, login, me
│   │   ├── rateLimit.js     # /api/rate-limits — CRUD (admin)
│   │   ├── api.js           # /api/protected — rate-limited endpoints
│   │   └── usage.js         # /api/usage — stats and logs
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── api/axios.js          # Axios instance with JWT interceptor
    │   ├── context/AuthContext   # Global auth state
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── UserDashboard.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── .env.example
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Get current user info |

### Rate Limit Rules
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/rate-limits` | JWT | Get active rule (user) / all rules (admin) |
| POST | `/api/rate-limits` | Admin | Create a new rule |
| PUT | `/api/rate-limits/:id` | Admin | Update a rule |
| DELETE | `/api/rate-limits/:id` | Admin | Delete a rule |

### Protected (Rate-Limited) APIs
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/protected/data` | JWT + Rate Limit | Sample protected endpoint |
| GET | `/api/protected/resource` | JWT + Rate Limit | Sample protected endpoint |
| POST | `/api/protected/action` | JWT + Rate Limit | Sample protected POST |

### Usage / Stats
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/usage/me` | JWT | Own request history (paginated) |
| GET | `/api/usage/all` | Admin | All users' logs (paginated) |
| GET | `/api/usage/summary` | Admin | Aggregated per-user stats |

---

## Database Schema

### Users
```js
{ username, email, password (hashed), role: 'user'|'admin', createdAt, updatedAt }
```

### RateLimits
```js
{ name, maxRequests, windowMinutes, description, isActive, createdBy (ref User) }
```

### ApiUsage
```js
{ user (ref User), endpoint, method, statusCode, blocked, timestamp, rateLimitRule (ref RateLimit) }
// Indexes: { user, timestamp }, { user, endpoint, timestamp }
```

---

## How Rate Limiting Works

1. Every protected request passes through `middleware/rateLimit.js`
2. Middleware fetches the **active rule from MongoDB** (no in-memory counters)
3. It counts how many **non-blocked** requests this user made within the rolling window
4. If `count >= maxRequests`, the request is **logged as blocked** and returns `429`
5. Otherwise the request is allowed, and **logged after success**
6. Window resets naturally — old records fall outside the `windowStart` threshold

---

## Run Locally

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
# Runs on http://localhost:3000
```

---

## Deployment

### Backend → Render
1. Push `backend/` to GitHub
2. Create a **Web Service** on [Render](https://render.com)
3. Set env vars: `MONGO_URI`, `JWT_SECRET`, `PORT`
4. Build command: `npm install` | Start: `node server.js`

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import on [Vercel](https://vercel.com)
3. Set env var: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Build: `npm run build` | Output: `dist`

---

## Live Links

- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://your-api.onrender.com`

---

## Evaluation Checklist

- [x] JWT authentication on all protected routes
- [x] Role-based access (USER / ADMIN)
- [x] Rate limit rules stored in MongoDB
- [x] All usage tracked per-user in MongoDB
- [x] No in-memory counters — fully DB-backed
- [x] Proper 429 response with reset info
- [x] Admin CRUD for rate limit rules
- [x] User and Admin dashboards
- [x] Environment variables for secrets
- [x] README with all required sections
