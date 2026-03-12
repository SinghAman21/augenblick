# Augenblick Backend (Grok AI proxy)

This server keeps your xAI API key secure and proxies AI requests from the frontend.

## Setup

1. Get an API key from [xAI Console](https://console.x.ai/) (free credits available).
2. Copy `.env.example` to `.env` and set your key:
   ```bash
   cp .env.example .env
   # Edit .env: set XAI_API_KEY=your_key
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Server runs at `http://localhost:3001`. The frontend proxies `/api` to this server when you run `npm run dev` in the frontend.

## Endpoints

- `POST /api/ai` — Body: `{ action: "generate"|"expand"|"summarize"|"related"|"chat", prompt?, context?, ideas? }`. Returns `{ text: string }`.

## Model

Uses `grok-3-mini` by default (cost-effective, fast). Change `MODEL` in `server.js` to `grok-4` or `grok-4.1-fast` if needed.
