const ordersDb = require('../db/models/orders');
const customersDb = require('../db/models/customers');
const ridersDb = require('../db/models/riders');
const conversationsDb = require('../db/models/conversations');
const disputesDb = require('../db/models/disputes');
const notifier = require('./notifier');
const dispatcher = require('./dispatcher');

async function placeOrder(customerTelegramId, cart, businessId, addressData) {
  const customer = await customersDb.findByTelegramId(customerTelegramId);
  const db = require('../db');
  const deliveryFee = parseFloat(
    await db('config').where({ key: 'delivery_fee' }).first().then((r) => r.value)
  );

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + deliveryFee;

  const order = await ordersDb.create({
    order: {
      customer_id: customer.id,
      business_id: businessId,
      status: 'pending_payment',
      subtotal,
      delivery_fee: deliveryFee,
      total,
      ...addressData,
    },
    items: cart.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
    })),
  });

  await conversationsDb.set(customerTelegramId, 'awaiting_payment', cart, { businessId, orderId: order.id });
  await notifier.onOrderCreated(order.id);
  return order;
}

async function transition(orderId, newStatus, extra = {}) {
  const order = await ordersDb.findWithItems(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  await ordersDb.updateStatus(orderId, newStatus, extra);
  await notifier.notify(orderId, newStatus, order);

  if (newStatus === 'ready') {
    await dispatcher.findAndAssign(orderId);
  }
}

async function assignRider(orderId, riderId) {
  const order = await ordersDb.findWithItems(orderId);
  await ordersDb.updateStatus(orderId, 'rider_assigned', { rider_id: riderId, rider_assigned_at: new Date() });
  await ridersDb.updateStatusById(riderId, 'going_to_business');
  await notifier.notify(orderId, 'rider_assigned', { ...order, rider_id: riderId });
}

async function tryNextRider(orderId) {
  const order = await ordersDb.findWithItems(orderId);
  await dispatcher.findAndAssign(orderId, order._excludedRiders || []);
}

module.exports = { placeOrder, transition, assignRider, tryNextRider };
