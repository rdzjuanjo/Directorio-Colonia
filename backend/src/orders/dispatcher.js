const ridersDb = require('../db/models/riders');
const ordersDb = require('../db/models/orders');
const sender = require('../telegram/sender');

async function findAndAssign(orderId, excludeRiderIds = []) {
  const order = await ordersDb.findWithItems(orderId);
  if (!order) return;

  const nearest = await ridersDb.findNearest(order.address_lat, order.address_lng);
  if (!nearest || excludeRiderIds.includes(nearest.id)) {
    await sender.sendText(order.customer_telegram_id,
      `⚠️ No hay repartidores disponibles ahora. El admin buscará uno manualmente.`);
    return;
  }

  const orderFsm = require('./state-machine');
  await orderFsm.assignRider(orderId, nearest.id);

  // Timeout para que el repartidor acepte
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

module.exports = { findAndAssign };
