require('dotenv').config();

// ─── Mock sender ──────────────────────────────────────────────────────────────
const PERSONAS = {
  111111111:  'cliente',
  3312345678: 'negocio',
  345211335:  'repartidor',
};

const COLORS = {
  cliente:    '\x1b[36m',
  negocio:    '\x1b[33m',
  repartidor: '\x1b[32m',
  reset:      '\x1b[0m',
  dim:        '\x1b[2m',
  bold:       '\x1b[1m',
};

function stripHtml(s) { return (s || '').replace(/<[^>]+>/g, ''); }

function box(chatId, label, lines) {
  const who   = PERSONAS[chatId] ?? String(chatId);
  const color = COLORS[who] || '';
  const title = `${color}Bot → ${who}${COLORS.reset} ${COLORS.dim}[${label}]${COLORS.reset}`;
  console.log(`\n  ${title}`);
  for (const line of lines) {
    if (!line.trim()) continue;
    for (const sub of line.split('\n')) {
      console.log(`  ${COLORS.dim}│${COLORS.reset} ${sub}`);
    }
  }
}

const mockSender = {
  sendText: async (chatId, text) =>
    box(chatId, 'text', [stripHtml(text)]),

  sendButtons: async (chatId, text, buttons) => {
    const btnLines = buttons.map((row) => {
      const cols = Array.isArray(row) ? row : [row];
      return cols.map((b) => `[${b.label}  cb:${b.data}]`).join('  ');
    });
    box(chatId, 'buttons', [stripHtml(text), '', ...btnLines]);
  },

  sendList: async (chatId, text, items) => {
    const itemLines = items.map((i) => `[${i.label}  cb:${i.data}]`);
    box(chatId, 'list', [stripHtml(text), '', ...itemLines]);
  },

  sendPhoto: async (chatId, url, caption) =>
    box(chatId, 'photo', [`📸 ${url}`, stripHtml(caption || '')]),

  requestLocation: async (chatId, text) =>
    box(chatId, 'location_request', [stripHtml(text), '[📍 Compartir ubicación]']),

  removeKeyboard: async (chatId, text) =>
    box(chatId, 'text', [stripHtml(text)]),

  answerCallback: async () => {},
  setWebhook:     async () => ({ ok: true }),
};

const senderPath = require.resolve('./src/telegram/sender');
require(senderPath);
require.cache[senderPath].exports = mockSender;

const { handleUpdate } = require('./src/bot/fsm');
const db = require('./src/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _id = 1;

function msg(chatId, text) {
  return { message: { message_id: _id++, chat: { id: chatId, type: 'private' }, from: { id: chatId, is_bot: false, first_name: PERSONAS[chatId] ?? 'user' }, text, date: Math.floor(Date.now() / 1000) } };
}
function cb(chatId, data) {
  return { callback_query: { id: String(_id++), from: { id: chatId }, message: { message_id: _id++, chat: { id: chatId } }, data } };
}
function loc(chatId, latitude, longitude) {
  return { message: { message_id: _id++, chat: { id: chatId, type: 'private' }, from: { id: chatId, is_bot: false, first_name: PERSONAS[chatId] ?? 'user' }, location: { latitude, longitude }, date: Math.floor(Date.now() / 1000) } };
}

async function step(label, update) {
  const who = PERSONAS[update.message?.chat?.id ?? update.callback_query?.message?.chat?.id] ?? '?';
  const color = COLORS[who] || '';
  console.log(`\n${color}${COLORS.bold}▶ [${who}] ${label}${COLORS.reset}`);
  await handleUpdate(update);
}

function pause(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ─── Flow ─────────────────────────────────────────────────────────────────────
const CLIENTE     = 111111111;
const NEGOCIO     = 3312345678;
const REPARTIDOR  = 345211335;
const LAT = -19.4326;
const LNG = -99.1332;

async function main() {
  console.log(`\n${COLORS.bold}═══════════════════════════════════════════════`);
  console.log('  SIMULACIÓN PEDIDO COMPLETO — Gestor de Colonia');
  console.log(`═══════════════════════════════════════════════${COLORS.reset}\n`);

  // Limpiar estado previo del cliente de prueba
  await db('conversations').where({ telegram_id: String(CLIENTE) }).delete();
  const prevCustomer = await db('customers').where({ telegram_id: String(CLIENTE) }).first();
  if (prevCustomer) {
    await db('order_items').whereIn('order_id', db('orders').where({ customer_id: prevCustomer.id }).select('id')).delete();
    await db('orders').where({ customer_id: prevCustomer.id }).delete();
    await db('customers').where({ id: prevCustomer.id }).delete();
  }

  // Asegurar que el repartidor esté disponible y con ubicación
  await db('riders').where({ telegram_id: String(REPARTIDOR) })
    .update({ status: 'waiting', current_lat: LAT, current_lng: LNG });
  console.log(`${COLORS.dim}[setup] repartidor → waiting con ubicación ${LAT}, ${LNG}${COLORS.reset}`);

  // ── 1. Onboarding del cliente ─────────────────────────────────────────────
  console.log(`\n${COLORS.bold}── FASE 1: Onboarding ──────────────────────────${COLORS.reset}`);
  await step('/start', msg(CLIENTE, '/start'));
  await step('nombre: Ana', msg(CLIENTE, 'Ana'));
  await step('ubicación compartida', loc(CLIENTE, LAT, LNG));

  // ── 2. Buscar negocio y armar carrito ─────────────────────────────────────
  console.log(`\n${COLORS.bold}── FASE 2: Pedido ──────────────────────────────${COLORS.reset}`);
  await step('buscar "pollo"', msg(CLIENTE, 'pollo'));
  await step('seleccionar pollos el pollo', cb(CLIENTE, 'biz:1'));
  await step('agregar Pollo al carrito', cb(CLIENTE, 'item:1'));
  await step('ver carrito', cb(CLIENTE, 'view_cart'));
  await step('confirmar pedido', cb(CLIENTE, 'confirm_order'));
  await step('usar dirección guardada', cb(CLIENTE, 'use_saved_address'));

  // Recuperar orderId de la DB
  const customer = await db('customers').where({ telegram_id: String(CLIENTE) }).first();
  const order = await db('orders').where({ customer_id: customer.id }).orderBy('id', 'desc').first();
  const orderId = order.id;
  console.log(`\n${COLORS.dim}[info] Pedido creado: #${orderId}${COLORS.reset}`);

  // ── 3. Cliente declara que pagó ───────────────────────────────────────────
  console.log(`\n${COLORS.bold}── FASE 3: Pago ────────────────────────────────${COLORS.reset}`);
  await step('ya pagué', cb(CLIENTE, 'paid'));

  // ── 4. Negocio confirma el pago ───────────────────────────────────────────
  console.log(`\n${COLORS.bold}── FASE 4: Negocio confirma ────────────────────${COLORS.reset}`);
  await step(`CONFIRMAR ${orderId}`, msg(NEGOCIO, `CONFIRMAR ${orderId}`));

  // ── 5. Negocio marca listo → dispatcher asigna repartidor ─────────────────
  console.log(`\n${COLORS.bold}── FASE 5: Pedido listo → asignación ───────────${COLORS.reset}`);
  await step(`LISTO ${orderId}`, msg(NEGOCIO, `LISTO ${orderId}`));
  await pause(300); // dispatcher es async dentro de transition

  // ── 6. Repartidor acepta, recoge y entrega ────────────────────────────────
  console.log(`\n${COLORS.bold}── FASE 6: Entrega ─────────────────────────────${COLORS.reset}`);
  await step(`aceptar pedido #${orderId}`, cb(REPARTIDOR, `accept_order:${orderId}`));
  await step('LLEGUE (al negocio)', msg(REPARTIDOR, 'LLEGUE'));
  await step(`RECOGER ${orderId}`, msg(REPARTIDOR, `RECOGER ${orderId}`));
  await step(`ENTREGAR ${orderId}`, msg(REPARTIDOR, `ENTREGAR ${orderId}`));

  // ── Estado final ──────────────────────────────────────────────────────────
  const finalOrder = await db('orders').where({ id: orderId }).first();
  console.log(`\n${COLORS.bold}═══════════════════════════════════════════════`);
  console.log(`  Pedido #${orderId} — estado final: ${finalOrder?.status}`);
  console.log(`═══════════════════════════════════════════════${COLORS.reset}\n`);

  await db.destroy();
}

main().catch((err) => { console.error(err); process.exit(1); });
