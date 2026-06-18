require('dotenv').config();

// ─── Personas ─────────────────────────────────────────────────────────────────
// negocio y repartidor usan los telegram_ids reales de la DB
const PERSONAS = {
  '521111111111@c.us': 'cliente',
  '3312345678':        'negocio',
  '345211335':         'repartidor',
};

const COLORS = {
  cliente:    '\x1b[36m',
  negocio:    '\x1b[33m',
  repartidor: '\x1b[32m',
  reset:      '\x1b[0m',
  dim:        '\x1b[2m',
  bold:       '\x1b[1m',
};

// ─── Mock del WA sender ───────────────────────────────────────────────────────
// Importante: storeButtonMap escribe en Redis REAL para poder testear
// la resolución número→callback_data igual que haría el listener real.

const redis = require('./src/redis');

function htmlToWa(text) {
  return (text || '')
    .replace(/<b>(.*?)<\/b>/gi, '*$1*')
    .replace(/<strong>(.*?)<\/strong>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '_$1_')
    .replace(/<code>(.*?)<\/code>/gi, '`$1`')
    .replace(/<[^>]+>/g, '');
}

async function storeButtonMap(chatId, dataArray) {
  await redis.set(`wa:bmap:${chatId}`, JSON.stringify(dataArray), { EX: 1800 });
}

function who(chatId) { return PERSONAS[chatId] ?? String(chatId); }
function color(chatId) { return COLORS[who(chatId)] || ''; }

function box(chatId, lines) {
  const title = `${color(chatId)}Bot → ${who(chatId)}${COLORS.reset}`;
  console.log(`\n  ${title}`);
  for (const line of lines) {
    if (!line.trim()) continue;
    for (const sub of line.split('\n')) {
      console.log(`  ${COLORS.dim}│${COLORS.reset} ${sub}`);
    }
  }
}

function numberedLines(text, items) {
  const lines = [htmlToWa(text)];
  items.forEach((item, i) => lines.push(`${i + 1}. ${item.label}`));
  return lines;
}

const mockWaSender = {
  setClient: () => {},

  sendText: async (chatId, text) =>
    box(chatId, [htmlToWa(text)]),

  sendButtons: async (chatId, text, buttons) => {
    const flat = buttons.flat();
    await storeButtonMap(chatId, flat.map((b) => b.data));
    box(chatId, numberedLines(text, flat));
  },

  sendList: async (chatId, text, items) => {
    await storeButtonMap(chatId, items.map((i) => i.data));
    box(chatId, numberedLines(text, items));
  },

  sendPhoto: async (chatId, photoUrl, caption) =>
    box(chatId, [`📸 ${photoUrl}`, htmlToWa(caption || '')]),

  requestLocation: async (chatId, text) =>
    box(chatId, [htmlToWa(text), '📎 [Compartir ubicación]']),

  removeKeyboard: async (chatId, text) =>
    box(chatId, [htmlToWa(text)]),

  answerCallback: async () => {},
  setWebhook:     async () => ({ ok: true }),
};

// Parchear src/sender antes de que cualquier handler lo cargue
const senderPath = require.resolve('./src/sender');
require(senderPath);
require.cache[senderPath].exports = mockWaSender;

const { handleUpdate } = require('./src/bot/fsm');
const db = require('./src/db');

// ─── Helpers de updates ───────────────────────────────────────────────────────
let _id = 1;

function msg(chatId, text) {
  return {
    message: {
      message_id: _id++,
      chat: { id: chatId, type: 'private' },
      from: { id: chatId, is_bot: false, first_name: who(chatId) },
      text,
      date: Math.floor(Date.now() / 1000),
    },
  };
}

function loc(chatId, latitude, longitude) {
  return {
    message: {
      message_id: _id++,
      chat: { id: chatId, type: 'private' },
      from: { id: chatId, is_bot: false, first_name: who(chatId) },
      location: { latitude, longitude },
      date: Math.floor(Date.now() / 1000),
    },
  };
}

function cb(chatId, data) {
  return {
    callback_query: {
      id: String(_id++),
      from: { id: chatId },
      message: { message_id: _id++, chat: { id: chatId } },
      data,
    },
  };
}

// Simula el usuario escribiendo un número: lee el mapa de Redis y resuelve
async function num(chatId, n) {
  const raw = await redis.get(`wa:bmap:${chatId}`);
  if (!raw) throw new Error(`No hay mapa de botones para ${who(chatId)}`);
  const map = JSON.parse(raw);
  const idx = n - 1;
  if (idx < 0 || idx >= map.length) throw new Error(`Número ${n} fuera de rango (máx ${map.length})`);
  return cb(chatId, map[idx]);
}

async function step(label, chatId, update) {
  console.log(`\n${color(chatId)}${COLORS.bold}▶ [${who(chatId)}] ${label}${COLORS.reset}`);
  await handleUpdate(update);
}

function header(title) {
  console.log(`\n${COLORS.bold}── ${title} ${'─'.repeat(Math.max(0, 46 - title.length))}${COLORS.reset}`);
}

function pause(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Constantes ───────────────────────────────────────────────────────────────
const CLIENTE    = '521111111111@c.us';
const NEGOCIO    = '3312345678';
const REPARTIDOR = '345211335';
const LAT = -19.4326;
const LNG = -99.1332;

// ─── Setup ────────────────────────────────────────────────────────────────────
async function reset() {
  await db('conversations').where({ telegram_id: String(CLIENTE) }).delete();
  const prev = await db('customers').where({ telegram_id: String(CLIENTE) }).first();
  if (prev) {
    await db('order_items').whereIn('order_id', db('orders').where({ customer_id: prev.id }).select('id')).delete();
    await db('orders').where({ customer_id: prev.id }).delete();
    await db('customers').where({ id: prev.id }).delete();
  }
  await redis.del(`wa:bmap:${CLIENTE}`);
  await db('riders').where({ telegram_id: String(REPARTIDOR) })
    .update({ status: 'waiting', current_lat: LAT, current_lng: LNG });
  console.log(`${COLORS.dim}[setup] DB y Redis limpios. Repartidor → waiting.${COLORS.reset}`);
}

// ─── Flujo completo ───────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${COLORS.bold}${'═'.repeat(52)}`);
  console.log('  SIMULACIÓN WA — Pedido completo (dirección guardada)');
  console.log(`${'═'.repeat(52)}${COLORS.reset}`);

  await reset();

  // ── Onboarding ──────────────────────────────────────────────────────────────
  header('FASE 1: Onboarding');
  await step('/start', CLIENTE, msg(CLIENTE, '/start'));
  await step('nombre: Ana', CLIENTE, msg(CLIENTE, 'Ana'));
  await step('ubicación GPS', CLIENTE, loc(CLIENTE, LAT, LNG));

  // ── Buscar y armar carrito ──────────────────────────────────────────────────
  header('FASE 2: Pedido');
  await step('buscar "pollo"', CLIENTE, msg(CLIENTE, 'pollo'));
  await step('escribe "1" → biz:1', CLIENTE, await num(CLIENTE, 1));
  await step('escribe "1" → item:1', CLIENTE, await num(CLIENTE, 1));
  await step('escribe "1" → ver carrito', CLIENTE, await num(CLIENTE, 1));
  await step('escribe "1" → confirmar pedido', CLIENTE, await num(CLIENTE, 1));
  await step('escribe "1" → usar dirección guardada', CLIENTE, await num(CLIENTE, 1));

  const customer = await db('customers').where({ telegram_id: String(CLIENTE) }).first();
  const order = await db('orders').where({ customer_id: customer.id }).orderBy('id', 'desc').first();
  const orderId = order.id;
  console.log(`\n${COLORS.dim}[info] Pedido creado: #${orderId}${COLORS.reset}`);

  // ── Pago ────────────────────────────────────────────────────────────────────
  header('FASE 3: Pago');
  await step('escribe "1" → ya pagué', CLIENTE, await num(CLIENTE, 1));

  // ── Negocio confirma ────────────────────────────────────────────────────────
  header('FASE 4: Negocio confirma');
  await step(`CONFIRMAR ${orderId}`, NEGOCIO, msg(NEGOCIO, `CONFIRMAR ${orderId}`));

  // ── Listo → asignación ──────────────────────────────────────────────────────
  header('FASE 5: Pedido listo → asignación');
  await step(`LISTO ${orderId}`, NEGOCIO, msg(NEGOCIO, `LISTO ${orderId}`));
  await pause(300);

  // ── Entrega ─────────────────────────────────────────────────────────────────
  header('FASE 6: Entrega');
  await step(`escribe "1" → aceptar #${orderId}`, REPARTIDOR, await num(REPARTIDOR, 1));
  await step('LLEGUE', REPARTIDOR, msg(REPARTIDOR, 'LLEGUE'));
  await step(`RECOGER ${orderId}`, REPARTIDOR, msg(REPARTIDOR, `RECOGER ${orderId}`));
  await step(`ENTREGAR ${orderId}`, REPARTIDOR, msg(REPARTIDOR, `ENTREGAR ${orderId}`));

  // ── Resultado ───────────────────────────────────────────────────────────────
  const final = await db('orders').where({ id: orderId }).first();
  const ok = final?.status === 'delivered';
  console.log(`\n${COLORS.bold}${'═'.repeat(52)}`);
  console.log(`  Pedido #${orderId} — estado final: ${final?.status}  ${ok ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`${'═'.repeat(52)}${COLORS.reset}\n`);

  await db.destroy();
  await redis.quit();
  process.exit(ok ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
