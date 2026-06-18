const ridersDb = require('../db/models/riders');
const ordersDb = require('../db/models/orders');
const businessesDb = require('../db/models/businesses');
const sender = require('../sender');

async function findAndAssign(orderId, excludeRiderIds = []) {
  const order = await ordersDb.findWithItems(orderId);
  if (!order) return;

  const nearest = await ridersDb.findNearest(order.address_lat, order.address_lng);
  if (!nearest || excludeRiderIds.includes(nearest.id)) {
    await handleNoRiders(order, orderId);
    return;
  }

  const orderFsm = require('./state-machine');
  await orderFsm.assignRider(orderId, nearest.id);

  const db = require('../db');
  const timeoutMin = parseInt(
    await db('config').where({ key: 'rider_accept_timeout_minutes' }).first().then((r) => r.value || '3')
  );

  setTimeout(async () => {
    const current = await ordersDb.findById(orderId);
    if (current?.status === 'rider_assigned') {
      await findAndAssign(orderId, [...excludeRiderIds, nearest.id]);
    }
  }, timeoutMin * 60 * 1000);
}

async function handleNoRiders(order, orderId) {
  // Notificar al admin si está configurado
  const db = require('../db');
  const adminCfg = await db('config').where({ key: 'admin_whatsapp_id' }).first();
  if (adminCfg?.value) {
    await sender.sendText(adminCfg.value,
      `⚠️ Sin repartidores para pedido #${orderId} (${order.business_name} → ${order.address_text}). Asigna uno manualmente desde el panel.`);
  }

  // Ofrecer pickup si el negocio lo acepta
  const biz = await businessesDb.findById(order.business_id);
  if (biz?.accepts_pickup) {
    const loc = biz.address_text ? `\n📍 ${biz.address_text}` : '';
    await sender.sendButtons(order.customer_whatsapp_id,
      `⚠️ No hay repartidores disponibles ahora para el pedido #${orderId}.\n\n¿Qué querés hacer?`,
      [
        { label: '🏪 Cambiar a retiro en tienda', data: 'switch_to_pickup' },
        { label: '⏳ Seguir esperando', data: 'keep_waiting' },
      ]);
  } else {
    await sender.sendText(order.customer_whatsapp_id,
      `⚠️ No hay repartidores disponibles ahora. El admin buscará uno manualmente.`);
  }
}

module.exports = { findAndAssign };
