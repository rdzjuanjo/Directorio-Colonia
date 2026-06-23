// orders.js — Modelo de pedidos: creación con ítems, búsqueda con joins, actualización de estado, rider y totales
const db = require('../index');

module.exports = {
  findById: (id) =>
    db('orders').where({ 'orders.id': id })
      .join('customers', 'orders.customer_id', 'customers.id')
      .join('businesses', 'orders.business_id', 'businesses.id')
      .select('orders.*', 'customers.name as customer_name', 'customers.whatsapp_id as customer_whatsapp_id',
        'businesses.name as business_name', 'businesses.whatsapp_id as business_whatsapp_id',
        'businesses.clabe', 'businesses.bank_name', 'businesses.account_holder',
        'businesses.address_text as business_address_text', 'businesses.accepts_pickup as business_accepts_pickup')
      .first(),

  findWithItems: async (id) => {
    const order = await module.exports.findById(id);
    if (!order) return null;
    order.items = await db('order_items').where({ order_id: id });
    return order;
  },

  findByCustomer: (customerId) =>
    db('orders').where({ customer_id: customerId }).orderBy('created_at', 'desc'),

  findByBusiness: (businessId, status = null) =>
    db('orders').where({ business_id: businessId })
      .modify((q) => { if (status) q.where({ status }); })
      .orderBy('created_at', 'desc'),

  findActive: () =>
    db('orders').whereNotIn('status', ['delivered', 'cancelled', 'disputed'])
      .orderBy('created_at', 'desc'),

  create: async ({ order, items }) => {
    return db.transaction(async (trx) => {
      const [created] = await trx('orders').insert(order).returning('*');
      if (items.length) {
        await trx('order_items').insert(items.map((i) => ({ ...i, order_id: created.id })));
      }
      return created;
    });
  },

  updateStatus: (id, status, extra = {}) =>
    db('orders').where({ id }).update({ status, ...extra, updated_at: db.fn.now() }).returning('*').then((r) => r[0]),

  updateItems: async (id, items) => {
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    return db.transaction(async (trx) => {
      const order = await trx('orders').where({ id }).select('delivery_type').first();
      await trx('order_items').where({ order_id: id }).delete();
      await trx('order_items').insert(items.map((i) => ({ ...i, order_id: id })));
      const { getConfig } = require('../../utils/getConfig');
      const deliveryFee = order?.delivery_type === 'pickup' ? 0
        : parseFloat(await getConfig('delivery_fee', '0'));
      await trx('orders').where({ id }).update({ subtotal, total: subtotal + deliveryFee, updated_at: db.fn.now() });
    });
  },
};
