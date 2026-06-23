// disputes.js — Modelo de disputas: creación desde pedidos, listado con filtros de estado, resolución y baneo de cliente por admin
const db = require('../index');

const TABLE = 'dispute_logs';

module.exports = {
  log: (data) => db(TABLE).insert(data).returning('*').then((r) => r[0]),

  findAll: (filters = {}) =>
    db(TABLE)
      .leftJoin('orders', 'dispute_logs.order_id', 'orders.id')
      .where(Object.fromEntries(Object.entries(filters).map(([k, v]) => [`dispute_logs.${k}`, v])))
      .select('dispute_logs.*')
      .orderBy('dispute_logs.created_at', 'desc'),

  resolve: (id) => db(TABLE).where({ id }).update({ resolved: true }),
};
