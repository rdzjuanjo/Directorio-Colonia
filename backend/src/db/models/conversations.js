// conversations.js — Modelo de conversaciones: estado FSM por whatsapp_id con TTL configurable; serializa carrito y contexto en JSON
const db = require('../index');

const TABLE = 'conversations';
const TTL_MINUTES = 30;

module.exports = {
  get: async (whatsappId) => {
    const tid = String(whatsappId);
    const row = await db(TABLE).where({ whatsapp_id: tid }).first();
    if (!row) return null;
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      await db(TABLE).where({ whatsapp_id: tid }).delete();
      return null;
    }
    return {
      ...row,
      cart_json: row.cart_json || [],
      context_json: row.context_json || {},
    };
  },

  set: async (whatsappId, state, cart = [], context = {}) => {
    const tid = String(whatsappId);
    const expires_at = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
    const existing = await db(TABLE).where({ whatsapp_id: tid }).first();
    if (existing) {
      return db(TABLE).where({ whatsapp_id: tid })
        .update({ state, cart_json: JSON.stringify(cart), context_json: JSON.stringify(context), expires_at, updated_at: db.fn.now() });
    }
    return db(TABLE).insert({ whatsapp_id: tid, state, cart_json: JSON.stringify(cart), context_json: JSON.stringify(context), expires_at });
  },

  clear: (whatsappId) =>
    db(TABLE).where({ whatsapp_id: String(whatsappId) }).delete(),
};
