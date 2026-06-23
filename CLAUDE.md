# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A neighborhood food-delivery platform for a closed community ("colonia"). Customers order via **WhatsApp**, businesses accept/manage orders through a web panel, and admins oversee everything through a separate panel. Riders are dispatched automatically and interact via WhatsApp.

## Repository layout

```
backend/        Node.js (CommonJS) — Fastify API + WhatsApp bot
admin-panel/    React 19 + Vite + Tailwind 4 — runs on :5173
business-panel/ React 19 + Vite + Tailwind 4 — runs on :5174
mosquitto/      MQTT broker config (reserved for future IoT/tracking)
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
npm run dev              # nodemon watch
npm run migrate          # knex migrate:latest
npm run migrate:rollback
npm run seed             # idempotent: admin user + all config defaults
npm run test:wa          # simulate a full order flow end-to-end (no WhatsApp needed)
npm run simulate         # interactive local bot simulator
```

### Frontends
```bash
cd admin-panel && npm run dev    # :5173
cd business-panel && npm run dev # :5174
```

## WhatsApp session

The bot uses `whatsapp-web.js` (Puppeteer-based). On first run it prints a QR code in the terminal — scan it once with the business WhatsApp account. The session is persisted to `backend/.wwebjs_auth/` (gitignored). `npm run simulate` runs a local text-only simulator that never touches WhatsApp.

## Frontend pages

**Admin panel** (`:5173`): Dashboard, Orders, Businesses, Riders, Disputes, Analytics, Zone.
- `Zone.jsx` — Leaflet map editor for drawing the delivery polygon; saves as JSON to `config.delivery_zone`.
- `recharts` is used for all charts (Analytics page).
- Business form includes an interactive Leaflet map picker (`LocationPicker.jsx`) and SVG icon picker (`IconPicker.jsx`). Icons are served from `GET /icons` (backend registry at `src/utils/businessIcons.js`, 25 icons).

**Business panel** (`:5174`): ActiveOrders, Menu, Hours, History, Analytics.
- `Hours.jsx` — per-day open/close schedule stored in `businesses.hours_json`.
- `Menu.jsx` — manages categories and items; photo uploads go to `backend/uploads/` and are served at `/uploads/`.

## Backend architecture

### WhatsApp → FSM pipeline

`whatsapp/listener.js` receives raw WhatsApp messages, normalises them into Telegram-shaped update objects (the FSM was originally built for Telegram), and calls `bot/fsm.js handleUpdate()`.

**Button simulation** — WhatsApp has no native buttons. `whatsapp/sender.js` sends numbered lists and stores the callback-data array in Redis under `wa:bmap:{chatId}` (30-min TTL). When the user replies with a digit, the listener resolves it back to the original callback data before routing through the FSM.

### Conversation FSM (`bot/fsm.js`)

Each WhatsApp chat has a persistent row in the `conversations` table (keyed by `whatsapp_id`). The `state` column drives routing:

| State | Handler |
|---|---|
| `idle` | `handlers/idle` |
| `onboarding_name`, `onboarding_location` | `handlers/onboarding` |
| `searching`, `selecting_business` | `handlers/search` |
| `browsing_menu` | `handlers/menu` |
| `cart` | `handlers/cart` |
| `confirm_delivery_type` | `handlers/cart` — delivery vs. pickup choice |
| `confirm_address` | `handlers/address` |
| `confirm_pickup` | `handlers/pickup` |
| `awaiting_payment` | `handlers/payment` |
| `order_active` | `handlers/orderActive` |

Riders and business users bypass the state lookup entirely — they are identified by `whatsapp_id` and routed directly to `handlers/riderCommands` or `handlers/businessCommands`.

### Order lifecycle (`orders/`)

```
pending_payment → payment_claimed → confirmed → preparing
  → [modified_pending →] ready → rider_assigned → in_delivery → delivered
  (cancelled / disputed reachable from any state)
```

**Pickup variant** — when `orders.delivery_type = 'pickup'`:
- `transition(orderId, 'ready')` skips `dispatcher.findAndAssign()` and fires `pickup_ready` instead
- `orders.delivery_fee` is always 0; `payment_method` may be `'at_store'` (skips payment flow, starts at `confirmed`)

Key files:
- `orders/state-machine.js` — `placeOrder()`, `transition()`, `assignRider()`, `tryNextRider()`
- `orders/notifier.js` — sends WhatsApp messages to all parties on each status change
- `orders/dispatcher.js` — finds nearest available rider; tracks excluded riders in Redis (`dispatch:ex:{orderId}` SADD, 24h TTL) so rejected riders aren't re-offered

### Delivery zone (`utils/geoUtils.js`)

`getDeliveryZone()` reads `config.delivery_zone` (JSON polygon `[[lat,lng],...]`). If set, `address.js` runs `pointInPolygon()` (ray-casting) before placing an order. Addresses outside the zone are routed to the pickup flow if the business supports it, or rejected otherwise. An empty/missing value means no restriction.

### Order watchdog (`jobs/orderWatchdog.js`)

Started in `server.js` at boot; runs every 60 seconds. Checks three stuck states against the `config` table timeouts:

| State | Config key | Action |
|---|---|---|
| `pending_payment` | `payment_timeout_minutes` (30) | Auto-cancels, notifies customer, notifies admin |
| `payment_claimed` | `payment_confirm_timeout_minutes` (30) | One-time admin alert via WhatsApp |
| `preparing` | `preparation_timeout_minutes` (90) | One-time admin alert via WhatsApp |

Dedup key for alerts: `watchdog:alerted:{orderId}:{status}` in Redis (1-day TTL).

### Sender abstraction (`src/sender.js`)

Single line re-exporting `whatsapp/sender.js`. All handlers and notifiers import from here — never directly from `whatsapp/sender.js`. Swapping providers means changing one file.

Key methods: `sendText`, `sendButtons`, `sendList`, `sendPhoto`, `requestLocation`, `removeKeyboard`.

### API routes

Registered in `server.js`:
- `POST /api/admin/login` — public
- `GET|POST|PUT|DELETE /api/admin/*` — JWT admin token required
- `POST /api/business/login` — public
- `GET|POST|PUT|DELETE /api/business/*` — JWT business token required
- `GET /catalog/:businessId` — public HTML catalog page (product grid with photos)
- `GET /directorio` — public HTML business directory listing
- `GET /mapa` — public Leaflet map of all businesses with colored SVG pins; clicking a pin opens a card with "Ver menú" and "Contactar" (WhatsApp) links
- `GET /icons` — public JSON icon registry; `Cache-Control: max-age=3600`; proxied from admin panel via Vite
- `GET /health`

Analytics endpoints (`GET /api/admin/analytics`, `GET /api/business/analytics`) share logic through `src/api/analyticsHelper.js` — only one has the `business_id` filter.

### Database

Knex + PostgreSQL. Knexfile at `src/db/knexfile.js`. Models are thin wrappers in `src/db/models/`. All `whatsapp_id` columns (customers, businesses, riders, conversations) are indexed with a unique constraint.

**`config` table keys** (all editable from admin panel):

| Key | Default | Purpose |
|---|---|---|
| `delivery_fee` | 30 | Added to delivery orders |
| `rider_accept_timeout_minutes` | 3 | Before trying next rider |
| `payment_timeout_minutes` | 30 | Auto-cancel if no payment |
| `payment_confirm_timeout_minutes` | 30 | Alert admin if business slow |
| `preparation_timeout_minutes` | 90 | Alert admin if business slow |
| `session_ttl_minutes` | 60 | Conversation TTL |
| `admin_whatsapp_id` | "" | Receives watchdog alerts |
| `delivery_zone` | "" | JSON polygon or empty = no restriction |

**Notable order columns**: `delivery_type` (`'delivery'`\|`'pickup'`), `payment_method` (`'transfer'`\|`'at_store'`), `delivery_fee`, `subtotal`, `total`.

**Notable business columns**: `accepts_pickup` (bool), `address_text` (nullable — shown to customer in pickup flow).

### Redis keys

| Key pattern | Purpose |
|---|---|
| `wa:bmap:{chatId}` | Button-number → callback_data map (30-min TTL) |
| `dispatch:ex:{orderId}` | Set of rider IDs already offered this order (24h TTL) |
| `watchdog:alerted:{orderId}:{status}` | Dedup flag for admin alerts (1-day TTL) |

## Mandatory patterns

### Reading config values
Always use `src/utils/getConfig.js` — never query the `config` table directly:
```js
const { getConfig } = require('../utils/getConfig');
const fee = parseFloat(await getConfig('delivery_fee', '0'));
```
Direct `.where({ key }).first().then((r) => r.value)` crashes if the seed hasn't run.

### Changing order status
Always call `orderFsm.transition(orderId, newStatus)` from `orders/state-machine.js`. Direct DB updates on `orders.status` bypass `notifier.js` and break the audit trail. The one intentional exception is `switch_to_pickup` in `handlers/orderActive.js`, which needs an atomic delivery_type + total recalculation — that comment explains why.

### Business endpoint ownership
Before mutating menu categories or items in `api/business.js`, call the ownership helpers in `db/models/menu.js`:
- `menuDb.categoryBelongsTo(categoryId, bizId)` — returns bool
- `menuDb.itemBelongsTo(itemId, bizId)` — returns bool
Return 403 if false. Skipping this check lets one business overwrite another's menu.

### Frontend API errors
The `req()` helper in both `api.js` files now throws on non-OK responses (`!res.ok`). Callers must wrap mutations in try/catch and show the error to the user. Reads (GET) that fail silently are generally acceptable if they show an empty state.

## End-to-end test (`test-flow-wa.js`)

`npm run test:wa` simulates a complete delivery order without WhatsApp. It patches `require.cache` to replace `src/sender.js` with a mock that prints to stdout and writes real button maps to Redis. The `reset()` function idempotently creates the test business, menu item, and rider if they don't exist. Run after any FSM or order-flow change to catch regressions.

## Environment

Copy `.env.example` to `.env` in `backend/`. Key vars:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL`
- `JWT_SECRET`
- `PORT` (default 3000)
- `PUBLIC_URL` — base URL for photo/catalog links sent in WhatsApp messages (e.g. `http://localhost:3000` in dev)
