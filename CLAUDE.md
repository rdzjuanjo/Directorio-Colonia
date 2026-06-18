# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A neighborhood food-delivery platform for a closed community ("colonia"). Customers order via **WhatsApp**, businesses accept/manage orders through a web panel, and admins oversee everything through a separate panel. Riders are dispatched automatically and interact via WhatsApp.

## Repository layout

```
backend/        Node.js (CommonJS) — Fastify API + WhatsApp bot
admin-panel/    React 19 + Vite + Tailwind 4 — runs on :5173
business-panel/ React 19 + Vite + Tailwind 4 — runs on :5174
mosquitto/      MQTT broker config (for future IoT/tracking use)
docker-compose.yml  PostgreSQL 16, Redis 7, Mosquitto 2
```

## Commands

### Infrastructure (start once)
```bash
docker compose up -d
```

### Backend
```bash
cd backend
npm run dev           # nodemon watch
npm run migrate       # knex migrate:latest
npm run migrate:rollback
npm run seed          # seeds admin user
npm run test:flow     # simulate a full order flow (no WhatsApp needed)
npm run test:wa       # WhatsApp-specific flow test
npm run simulate      # interactive local bot simulator
```

### Frontends
```bash
cd admin-panel && npm run dev    # :5173
cd business-panel && npm run dev # :5174
```

## Backend architecture

### WhatsApp → FSM pipeline

`whatsapp/listener.js` receives raw WhatsApp messages, translates them into Telegram-shaped update objects (the FSM was originally built for Telegram), and calls `bot/fsm.js handleUpdate()`.

**Button simulation** — WhatsApp has no native buttons. `whatsapp/sender.js` sends numbered lists and stores the callback-data array in Redis under `wa:bmap:{chatId}` (30-min TTL). When the user replies with a digit, the listener resolves it back to the original callback data before routing through the FSM.

### Conversation FSM (`bot/fsm.js`)

Each WhatsApp chat has a persistent conversation row in PostgreSQL (`conversations` table, keyed by `telegram_id` — the column is a legacy name; it now holds WhatsApp IDs like `521234567890@c.us`). The `state` column drives routing to one of these handlers:

| State | Handler |
|---|---|
| `idle` | `handlers/idle` |
| `onboarding_name`, `onboarding_location` | `handlers/onboarding` |
| `searching`, `selecting_business` | `handlers/search` |
| `browsing_menu` | `handlers/menu` |
| `cart` | `handlers/cart` |
| `confirm_address` | `handlers/address` |
| `awaiting_payment` | `handlers/payment` |
| `order_active` | `handlers/orderActive` |

Riders and business users bypass the state lookup and go directly to `handlers/riderCommands` or `handlers/businessCommands`.

### Order lifecycle (`orders/`)

```
pending_payment → payment_claimed → confirmed → preparing
  → [modified_pending →] ready → rider_assigned → in_delivery → delivered
  (or cancelled / disputed at any point)
```

- `state-machine.js` — `placeOrder()`, `transition()`, `assignRider()`
- `notifier.js` — sends WhatsApp messages to all parties on each status change
- `dispatcher.js` — finds nearest available rider; retries with exclusion list after timeout (configurable via `config` table key `rider_accept_timeout_minutes`)

### Sender abstraction (`src/sender.js`)

Re-exports `whatsapp/sender.js`. All handlers and notifiers call through this module — swap the implementation here to change the channel without touching the FSM.

Key methods: `sendText`, `sendButtons`, `sendList`, `sendPhoto`, `requestLocation`, `removeKeyboard`.

### API routes

Registered in `server.js`:
- `POST /api/admin/login` — public
- `GET|POST|PUT|DELETE /api/admin/*` — JWT admin token required
- `POST /api/business/login` — public
- `GET|POST|PUT|DELETE /api/business/*` — JWT business token required
- `GET /health`

### Database

Knex + PostgreSQL. Knexfile at `src/db/knexfile.js`. Models are thin wrappers in `src/db/models/`. The `config` table holds runtime tunables (`delivery_fee`, `rider_accept_timeout_minutes`, `payment_confirm_timeout_minutes`, `session_ttl_minutes`).

### Redis

Used exclusively for:
1. WhatsApp button maps: `wa:bmap:{chatId}` → JSON array of callback data strings

## Environment

Copy `.env.example` to `.env` in `backend/`. Key vars:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL`
- `JWT_SECRET`
- `PORT` (default 3000)

The `TELEGRAM_*` vars in `.env.example` are legacy and unused — the bot runs over WhatsApp only.
