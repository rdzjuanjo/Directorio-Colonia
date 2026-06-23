// customers.js — Modelo de clientes: registro, búsqueda por whatsapp_id, actualización de nombre y ubicación por defecto
const db = require('../index');

const TABLE = 'customers';

module.exports = {
  findByWhatsappId: (whatsappId) =>
    db(TABLE).where({ whatsapp_id: String(whatsappId) }).first(),

  create: (data) =>
    db(TABLE).insert(data).returning('*').then((r) => r[0]),

  update: (whatsappId, data) =>
    db(TABLE).where({ whatsapp_id: String(whatsappId) }).update(data).returning('*').then((r) => r[0]),
};
