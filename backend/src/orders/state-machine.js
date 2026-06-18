const ordersDb = require('../db/models/orders');
const customersDb = require('../db/models/customers');
const ridersDb = require('../db/models/riders');
const conversationsDb = require('../db/models/conversations');
const disputesDb = require('../db/models/disputes');
const notifier = require('./notifier');
const dispatcher = require('./dispatcher');

async function placeOrder(customerWhatsappId, cart, businessId, addressData, options = {}) {
  const { deliveryType = 'delivery', paymentMethod = 'transfer' } = options;
  const isPickup = deliveryType === 'pickup';
  const isAtStore = paymentMethod === 'at_store';

  const customer = await customersDb.findByWhatsappId(customerWhatsappId);
  const db = require('../db');

  const deliveryFee = isPickup ? 0 : parseFloat(
    await db('config').where({ key: 'delivery_fee' }).first().then((r) => r.value)
  );

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + deliveryFee;
  const initialStatus = isAtStore ? 'confirmed' : 'pending_payment';

  const order = await ordersDb.create({
    order: {
      customer_id: customer.id,
      business_id: businessId,
      status: initialStatus,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      ...addressData,
    },
    items: cart.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
    })),
  });

  if (isAtStore) {
    await conversationsDb.set(customerWhatsappId, 'order_active', cart, { businessId, orderId: order.id });
    await notifier.onPickupAtStoreCreated(order.id);
  } else {
    await conversationsDb.set(customerWhatsappId, 'awaiting_payment', cart, { businessId, orderId: order.id });
    await notifier.onOrderCreated(order.id);
  }
  return order;
}

async function transition(orderId, newStatus, extra = {}) {
  const order = await ordersDb.findWithItems(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);

  await ordersDb.updateStatus(orderId, newStatus, extra);

  const notifyStatus = (newStatus === 'ready' && order.delivery_type === 'pickup')
    ? 'pickup_ready'
    : newStatus;
  await notifier.notify(orderId, notifyStatus, order);

  if (newStatus === 'ready' && order.delivery_type !== 'pickup') {
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
