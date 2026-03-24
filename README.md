# Blankly

A collaborative canvas app. Draw shapes, text, and diagrams — share with others in real time.

## Project Structure
```
blankly-2/
├── frontend/   # Next.js app (UI, auth, canvas, cloud save)
└── backend/    # Node.js + Socket.io server (real-time collaboration)
```

## Local Setup

### Prerequisites
- Node.js 18+
- An Upstash Redis database (free tier works)
- A Google Cloud project with OAuth 2.0 credentials

### 1. Clone the repo
```bash
git clone https://github.com/adityadewhy/blankly-2
cd blankly-2
```

### 2. Set up the frontend
```bash
cd frontend
npm install
cp .env.example .env
```
Fill in your `.env` file — see the section below.

Then run:
```bash
npm run dev
```
Frontend runs on http://localhost:3000

### 3. Set up the backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on http://localhost:3001

The backend must be running for real-time collaboration (share feature) to work.
You do NOT need the backend running for basic canvas and cloud save to work.

## Environment Variables

Create `frontend/.env` based on `frontend/.env.example`:

| Variable | Where to get it |
|---|---|
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in terminal |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `UPSTASH_REDIS_REST_URL` | Upstash Console → your database → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Same as above |

## Features
- Login with Google
- Draw shapes, arrows, lines, circles, text, freehand
- Upload images to canvas
- Real-time collaboration via share codes
- Manual cloud save (shapes and text only — images are stored locally)
- Cloud state loaded on login with option to keep local version