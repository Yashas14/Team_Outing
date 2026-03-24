# 🏖️ Team Outing 2026 — Full-Stack Web Application

A modern, full-stack Team Outing platform for managing company events with RSVP voting, real-time countdown, photo sharing, anonymous feedback, and messaging.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)

## ✨ Features

### Employee Portal
- 🗳️ **RSVP Voting** — YES with confetti celebration / NO with warm "we'll miss you" modal
- ⏳ **Countdown Timer** — Flip-card animation counting down to April 1, 2026
- 📸 **Photo Gallery** — Drag-and-drop upload, masonry grid, likes, lightbox view
- 💬 **Feedback** — Star ratings, categories, anonymous option
- 📬 **Team Chat** — Real-time global message board with emoji support
- 📊 **Polls** — Vote on activities, food, and more
- 🎫 **Digital Ticket** — Personalized "You're Going!" card
- 🏆 **Leaderboard** — Most photos uploaded, most liked photo

### Admin Dashboard
- 📈 **Stats Overview** — Real-time RSVP counts, progress bars, key metrics
- 📋 **RSVP Management** — Full list with filter, CSV export
- 🗳️ **Poll Creation** — Create custom polls with unlimited options
- 📸 **Photo Moderation** — View all photos, delete capability
- ⭐ **Feedback Panel** — All feedback with ratings, categories, anonymous flagging
- 👤 **User Management** — Invite employees via email
- ⚙️ **Event Settings** — Edit venue, address, description
- 📝 **Activity Log** — Timestamped audit trail of all user actions

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Hook Form, Zod |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, JWT Auth, Zod |
| **Database** | PostgreSQL, Redis |
| **Real-time** | Socket.IO |
| **Storage** | Cloudinary (photos) |
| **DevOps** | Docker Compose, GitHub Actions CI/CD |

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis (optional, for caching)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd team-outing

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Environment Setup

```bash
# Copy env example (from project root)
cp .env.example server/.env

# Edit with your values
# Required: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
```

### 3. Database Setup

```bash
cd server

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with demo data
npm run db:seed
```

### 4. Run Development

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open http://localhost:3000

### 5. Demo Logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Employee | john@company.com | employee123 |

## 🐳 Docker

```bash
# Start all services (PostgreSQL, Redis, Server, Client)
docker-compose up -d

# Access at http://localhost:3000
```

## 📁 Project Structure

```
team-outing/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # LoginPage, EmployeePage, AdminPage
│   │   ├── store/           # Zustand state stores
│   │   ├── hooks/           # Custom hooks (countdown, socket)
│   │   ├── lib/             # API client, socket, utilities
│   │   └── types/           # TypeScript type definitions
│   └── index.html
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Auth, admin, upload middleware
│   │   ├── sockets/         # Socket.IO event handlers
│   │   ├── lib/             # Prisma client
│   │   └── prisma/          # Schema + seed
│   └── prisma/
│       └── schema.prisma
│
├── docker-compose.yml
├── .github/workflows/ci.yml
└── .env.example
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Current user |
| POST | `/api/rsvp` | Submit RSVP |
| PUT | `/api/rsvp` | Update RSVP |
| GET | `/api/rsvp/mine` | Get own RSVP |
| GET | `/api/rsvp/all` | All RSVPs (admin) |
| GET | `/api/polls` | Active polls |
| POST | `/api/polls/:id/vote` | Cast vote |
| POST | `/api/polls` | Create poll (admin) |
| POST | `/api/photos/upload` | Upload photos |
| POST | `/api/photos/:id/like` | Toggle like |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/messages` | Get messages |
| POST | `/api/messages` | Send message |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/activity-log` | Activity log |
| GET | `/api/event/config` | Event details |

## 📡 Real-Time Events (Socket.IO)

| Event | Description |
|-------|-------------|
| `rsvp:updated` | RSVP count changed |
| `poll:vote` | New poll vote |
| `photo:uploaded` | New photo uploaded |
| `feedback:new` | New feedback (admin only) |
| `message:new` | New global message |

## 🎨 Design System

- **Primary:** Vibrant coral-orange `#FF6B35`
- **Secondary:** Warm yellow `#FFD166`
- **Accent:** Teal-mint `#06D6A0`
- **Dark:** Deep navy `#1A1A2E`
- **Fonts:** Syne (headings), Plus Jakarta Sans (body)

---

*Built for Team Outing — April 1st, 2026 🎉*
