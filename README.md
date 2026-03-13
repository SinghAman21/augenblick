# Augenblick

Augenblick is a collaborative brainstorming workspace. Teams can create sessions, add ideas, vote, comment, and use an AI assistant to expand or summarize discussions.

The project is split into two apps:

- a React frontend for the product UI
- an Express backend for APIs, data access, and AI proxying

## What the project includes

### Frontend (Vite + React + TypeScript)

The frontend handles:

- landing page and product marketing sections
- authentication flows (sign in / sign up)
- dashboard and session management screens
- session workspace, idea detail views, voting, and comments
- AI page for generation, expansion, summarization, related ideas, and chat
- theming and reusable UI components (shadcn + Tailwind)

Main frontend app path: [frontend](frontend)

### Backend (Express + TypeScript)

The backend handles:

- session APIs (list, create, update, delete)
- session members and voter summaries
- dashboard stats endpoint
- idea details, idea votes, comments, and comment votes
- AI endpoint (`POST /api/ai`) and health check (`GET /api/health`)
- Supabase access with server-side credentials

Main backend app path: [backend](backend)

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query, React Router
- Backend: Node.js, Express, TypeScript, Zod, Supabase
- Auth/Data: Clerk + Supabase
- AI Providers: Groq and/or xAI (via backend environment variables)

## Local development

## 1) Clone and install

```bash
git clone <your-repo-url>
cd augenblick
```

## 2) Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the required variables:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
GROQ_API_KEY=...        # optional
XAI_API_KEY=...         # optional
```

Run backend:

```bash
npm run dev
```

## 3) Frontend setup

In a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Run frontend:

```bash
npm run dev
```

Frontend will be available on the Vite dev URL (usually `http://localhost:5173`).

## Common scripts

### Frontend

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run test` — run tests
- `npm run lint` — lint source

### Backend

- `npm run dev` — start server with watch mode
- `npm run build` — compile TypeScript
- `npm run start` — run compiled server
- `npm run lint` — lint source

## API overview

Base URL: `http://localhost:4000/api`

- `GET /health`
- `GET /sessions`
- `GET /sessions/:id`
- `POST /sessions`
- `PATCH /sessions/:id`
- `DELETE /sessions/:id`
- `GET /sessions/:id/members`
- `GET /sessions/:id/voters`
- `GET /dashboard/stats`
- `GET /ideas/:id`
- `POST /ideas/:id/vote`
- `GET /ideas/:id/comments`
- `POST /ideas/:id/comments`
- `POST /ideas/:id/comments/:commentId/vote`
- `POST /ai`

## Project structure

- [frontend](frontend): React client app
- [backend](backend): Express API server

## Notes

- Keep service-role keys only in backend environment files.
- If AI requests fail, check `/api/health` and verify one AI key is configured.
- If CORS errors appear, make sure your frontend origin is listed in `CORS_ORIGIN`.
