const db = require('../db');
const redis = require('../redis');
const sender = require('../sender');
const conversationsDb = require('../db/models/conversations');

async function runWatchdog() {
  const configs = await db('config').whereIn('key', [
    'payment_timeout_minutes',
    'payment_confirm_timeout_minutes',
    'preparation_timeout_minutes',
    'admin_whatsapp_id',
  ]);
  const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]));
  const adminId = cfg.admin_whatsapp_id || null;
  const now = Date.now();

  // ── 1. Auto-cancelar pedidos en pending_payment demasiado tiempo ────────────
  const payMin = parseInt(cfg.payment_timeout_minutes || '30');
  const stalePending = await db('orders')
    .join('customers', 'orders.customer_id', 'customers.id')
    .where('orders.status', 'pending_payment')
    .where('orders.updated_at', '<', new Date(now - payMin * 60 * 1000))
    .select('orders.id', 'orders.business_id', 'customers.whatsapp_id as customer_whatsapp_id');

  for (const order of stalePending) {
    await db('orders').where({ id: order.id }).update({ status: 'cancelled', updated_at: db.fn.now() });
    await conversationsDb.set(order.customer_whatsapp_id, 'idle', [], {});
    await sender.sendText(order.customer_whatsapp_id,
      `⏰ Tu pedido #${order.id} fue cancelado porque no recibimos confirmación de pago en ${payMin} minutos.\n\nSi quieres hacer un nuevo pedido, escríbenos cuando gustes.`);
    if (adminId) {
      await sender.sendText(adminId,
        `🔔 Pedido #${order.id} cancelado automáticamente — sin pago en ${payMin} min.`);
    }
    console.log(`[watchdog] Pedido #${order.id} cancelado por timeout de pago.`);
  }

  // ── 2. Alertar admin si negocio no confirma pago ────────────────────────────
  const confirmMin = parseInt(cfg.payment_confirm_timeout_minutes || '30');
  const staleConfirm = await db('orders')
    .join('businesses', 'orders.business_id', 'businesses.id')
    .where('orders.status', 'payment_claimed')
    .where('orders.updated_at', '<', new Date(now - confirmMin * 60 * 1000))
    .select('orders.id', 'orders.updated_at', 'businesses.name as business_name');

  for (const order of staleConfirm) {
    const key = `watchdog:alerted:${order.id}:payment_claimed`;
    if (adminId && !(await redis.get(key))) {
      const mins = Math.round((now - new Date(order.updated_at).getTime()) / 60000);
      await sender.sendText(adminId,
        `⚠️ Pedido #${order.id} lleva ${mins} min esperando confirmación del negocio *${order.business_name}*. Revisión manual recomendada.`);
      await redis.set(key, '1', { EX: 86400 });
    }
  }

  // ── 3. Alertar admin si negocio tarda en preparar ──────────────────────────
  const prepMin = parseInt(cfg.preparation_timeout_minutes || '90');
  const stalePrep = await db('orders')
    .join('businesses', 'orders.business_id', 'businesses.id')
    .where('orders.status', 'preparing')
    .where('orders.updated_at', '<', new Date(now - prepMin * 60 * 1000))
    .select('orders.id', 'orders.updated_at', 'businesses.name as business_name');

  for (const order of stalePrep) {
    const key = `watchdog:alerted:${order.id}:preparing`;
    if (adminId && !(await redis.get(key))) {
      const mins = Math.round((now - new Date(order.updated_at).getTime()) / 60000);
      await sender.sendText(adminId,
        `⚠️ Pedido #${order.id} lleva ${mins} min en preparación en *${order.business_name}*. ¿Está todo bien?`);
      await redis.set(key, '1', { EX: 86400 });
    }
  }
}

function startWatchdog() {
  console.log('🔍 Watchdog de pedidos iniciado (intervalo: 60s)');
  runWatchdog().catch((e) => console.error('[watchdog]', e.message));
  return setInterval(async () => {
    try { await runWatchdog(); } catch (e) { console.error('[watchdog]', e.message); }
  }, 60 * 1000);
}

module.exports = { startWatchdog };
