// dispatcher.js — Encuentra el repartidor disponible más cercano y gestiona reintentos con timeout configurable por Redis
const ridersDb = require('../db/models/riders');
const ordersDb = require('../db/models/orders');
const sender = require('../sender');

async function findAndAssign(orderId, excludeRiderIds = []) {
  const order = await ordersDb.findWithItems(orderId);
  if (!order) return;

  const nearest = await ridersDb.findNearest(order.address_lat, order.address_lng);
  if (!nearest || excludeRiderIds.includes(nearest.id)) {
    await handleNoRiders(order, orderId);
    return;
  }

  const redis = require('../redis');
  await redis.sAdd(`dispatch:ex:${orderId}`, String(nearest.id));
  await redis.expire(`dispatch:ex:${orderId}`, 86400);

  const orderFsm = require('./state-machine');
  await orderFsm.assignRider(orderId, nearest.id);

  const { getConfig } = require('../utils/getConfig');
  const timeoutMin = parseInt(await getConfig('rider_accept_timeout_minutes', '3'));

  setTimeout(async () => {
    try {
      const current = await ordersDb.findById(orderId);
      if (current?.status === 'rider_assigned' && current?.rider_id === nearest.id) {
        await findAndAssign(orderId, [...excludeRiderIds, nearest.id]);
      }
    } catch (e) {
      console.error('[dispatcher] error en timeout de reasignación:', e);
    }
  }, timeoutMin * 60 * 1000);
}

async function handleNoRiders(order, orderId) {
  const db = require('../db');
  const adminCfg = await db('config').where({ key: 'admin_whatsapp_id' }).first();
  if (adminCfg?.value) {
    await sender.sendText(adminCfg.value,
      `⚠️ Sin repartidores para pedido #${orderId} (${order.business_name} → ${order.address_text}). Asigna uno manualmente desde el panel.`);
  }

  if (order.business_accepts_pickup) {
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
