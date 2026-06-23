// test-flow.js — Script de prueba básico del flujo de pedido end-to-end sin WhatsApp real
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

const senderPath = require.resolve('./src/sender');
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

function header(title) {
  console.log(`\n${COLORS.bold}── ${title} ${'─'.repeat(Math.max(0, 46 - title.length))}${COLORS.reset}`);
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const CLIENTE    = 111111111;
const NEGOCIO    = 3312345678;
const REPARTIDOR = 345211335;
const LAT = -19.4326;
const LNG = -99.1332;

// ─── Setup / teardown ─────────────────────────────────────────────────────────
async function resetCliente() {
  await db('conversations').where({ whatsapp_id: String(CLIENTE) }).delete();
  const prev = await db('customers').where({ whatsapp_id: String(CLIENTE) }).first();
  if (prev) {
    await db('order_items').whereIn('order_id', db('orders').where({ customer_id: prev.id }).select('id')).delete();
    await db('orders').where({ customer_id: prev.id }).delete();
    await db('customers').where({ id: prev.id }).delete();
  }
}

async function setupRepartidor() {
  await db('riders').where({ whatsapp_id: String(REPARTIDOR) })
    .update({ status: 'waiting', current_lat: LAT, current_lng: LNG });
  console.log(`${COLORS.dim}[setup] repartidor → waiting con ubicación ${LAT}, ${LNG}${COLORS.reset}`);
}

// ─── Fase compartida: carrito ─────────────────────────────────────────────────
async function faseCarrito() {
  header('FASE 2: Carrito');
  await step('buscar "pollo"', msg(CLIENTE, 'pollo'));
  await step('seleccionar pollos el pollo', cb(CLIENTE, 'biz:1'));
  await step('agregar Pollo al carrito', cb(CLIENTE, 'item:1'));
  await step('ver carrito', cb(CLIENTE, 'view_cart'));
}

// ─── Fase compartida: pago → entrega ─────────────────────────────────────────
async function fasePagoYEntrega(orderId) {
  header('FASE 4: Pago');
  await step('ya pagué', cb(CLIENTE, 'paid'));

  header('FASE 5: Negocio confirma');
  await step(`CONFIRMAR ${orderId}`, msg(NEGOCIO, `CONFIRMAR ${orderId}`));

  header('FASE 6: Pedido listo → asignación');
  await step(`LISTO ${orderId}`, msg(NEGOCIO, `LISTO ${orderId}`));
  await pause(300);

  header('FASE 7: Entrega');
  await step(`aceptar pedido #${orderId}`, cb(REPARTIDOR, `accept_order:${orderId}`));
  await step('LLEGUE (al negocio)', msg(REPARTIDOR, 'LLEGUE'));
  await step(`RECOGER ${orderId}`, msg(REPARTIDOR, `RECOGER ${orderId}`));
  await step(`ENTREGAR ${orderId}`, msg(REPARTIDOR, `ENTREGAR ${orderId}`));

  const finalOrder = await db('orders').where({ id: orderId }).first();
  console.log(`\n${COLORS.dim}[resultado] Pedido #${orderId} — estado final: ${finalOrder?.status}${COLORS.reset}`);
  return finalOrder?.status;
}

async function getLastOrderId() {
  const customer = await db('customers').where({ whatsapp_id: String(CLIENTE) }).first();
  const order = await db('orders').where({ customer_id: customer.id }).orderBy('id', 'desc').first();
  console.log(`\n${COLORS.dim}[info] Pedido creado: #${order.id}${COLORS.reset}`);
  return order.id;
}

// ═════════════════════════════════════════════════════════════════════════════
// ESCENARIO A: Dirección guardada (lat/lng desde onboarding)
// ═════════════════════════════════════════════════════════════════════════════
async function escenarioA() {
  console.log(`\n${COLORS.bold}${'═'.repeat(48)}`);
  console.log('  ESCENARIO A: Dirección guardada (onboarding con GPS)');
  console.log(`${'═'.repeat(48)}${COLORS.reset}`);

  await resetCliente();
  await setupRepartidor();

  header('FASE 1: Onboarding con ubicación GPS');
  await step('/start', msg(CLIENTE, '/start'));
  await step('nombre: Ana', msg(CLIENTE, 'Ana'));
  await step('comparte ubicación GPS', loc(CLIENTE, LAT, LNG));

  await faseCarrito();

  header('FASE 3: Dirección → usa la guardada');
  await step('confirmar pedido', cb(CLIENTE, 'confirm_order'));
  await step('usar dirección guardada', cb(CLIENTE, 'use_saved_address'));

  const orderId = await getLastOrderId();
  const status = await fasePagoYEntrega(orderId);

  console.log(`\n${COLORS.bold}  Escenario A: ${status === 'delivered' ? '✅ OK' : '❌ FALLÓ — ' + status}${COLORS.reset}`);
  return status === 'delivered';
}

// ═════════════════════════════════════════════════════════════════════════════
// ESCENARIO B: Dirección nueva en el checkout, sin guardar
// ═════════════════════════════════════════════════════════════════════════════
async function escenarioB() {
  console.log(`\n${COLORS.bold}${'═'.repeat(48)}`);
  console.log('  ESCENARIO B: Dirección nueva en checkout — no guardar');
  console.log(`${'═'.repeat(48)}${COLORS.reset}`);

  await resetCliente();
  await setupRepartidor();

  // Onboarding con dirección de texto → cliente sin lat/lng
  header('FASE 1: Onboarding con dirección de texto');
  await step('/start', msg(CLIENTE, '/start'));
  await step('nombre: Ana', msg(CLIENTE, 'Ana'));
  await step('escribe dirección: "Calle Falsa 123"', msg(CLIENTE, 'Calle Falsa 123'));

  await faseCarrito();

  // Sin lat/lng → bot pide ubicación en el checkout
  header('FASE 3: Dirección nueva en checkout');
  await step('confirmar pedido', cb(CLIENTE, 'confirm_order'));
  await step('comparte ubicación de entrega', loc(CLIENTE, LAT, LNG));
  await step('no guardar como default', cb(CLIENTE, 'save_address_no'));

  const orderId = await getLastOrderId();
  const status = await fasePagoYEntrega(orderId);

  console.log(`\n${COLORS.bold}  Escenario B: ${status === 'delivered' ? '✅ OK' : '❌ FALLÓ — ' + status}${COLORS.reset}`);
  return status === 'delivered';
}

// ═════════════════════════════════════════════════════════════════════════════
// ESCENARIO C: Dirección nueva en checkout, sí guardar
// ═════════════════════════════════════════════════════════════════════════════
async function escenarioC() {
  console.log(`\n${COLORS.bold}${'═'.repeat(48)}`);
  console.log('  ESCENARIO C: Dirección nueva en checkout — sí guardar');
  console.log(`${'═'.repeat(48)}${COLORS.reset}`);

  await resetCliente();
  await setupRepartidor();

  header('FASE 1: Onboarding con dirección de texto');
  await step('/start', msg(CLIENTE, '/start'));
  await step('nombre: Ana', msg(CLIENTE, 'Ana'));
  await step('escribe dirección: "Calle Falsa 123"', msg(CLIENTE, 'Calle Falsa 123'));

  await faseCarrito();

  header('FASE 3: Dirección nueva en checkout — guardar como default');
  await step('confirmar pedido', cb(CLIENTE, 'confirm_order'));
  await step('comparte ubicación de entrega', loc(CLIENTE, LAT, LNG));
  await step('guardar como dirección default', cb(CLIENTE, 'save_address_yes'));

  const orderId = await getLastOrderId();

  // Verificar que la dirección quedó guardada
  const customer = await db('customers').where({ whatsapp_id: String(CLIENTE) }).first();
  const guardada = customer.default_lat && customer.default_lng;
  console.log(`\n${COLORS.dim}[check] dirección guardada en DB: ${guardada ? '✅ sí' : '❌ no'}${COLORS.reset}`);

  const status = await fasePagoYEntrega(orderId);

  console.log(`\n${COLORS.bold}  Escenario C: ${status === 'delivered' && guardada ? '✅ OK' : '❌ FALLÓ'}${COLORS.reset}`);
  return status === 'delivered' && guardada;
}

// ─── Runner ───────────────────────────────────────────────────────────────────
async function main() {
  const results = {};
  results.A = await escenarioA();
  results.B = await escenarioB();
  results.C = await escenarioC();

  console.log(`\n${COLORS.bold}${'═'.repeat(48)}`);
  console.log('  RESUMEN');
  console.log(`${'═'.repeat(48)}${COLORS.reset}`);
  for (const [k, ok] of Object.entries(results)) {
    console.log(`  Escenario ${k}: ${ok ? `${COLORS.bold}\x1b[32m✅ PASS${COLORS.reset}` : `${COLORS.bold}\x1b[31m❌ FAIL${COLORS.reset}`}`);
  }
  console.log('');

  await db.destroy();
  process.exit(Object.values(results).every(Boolean) ? 0 : 1);
}

main().catch((err) => { console.error(err); process.exit(1); });
