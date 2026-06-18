const db = require('../index');

const TABLE = 'conversations';
const TTL_MINUTES = 30;

module.exports = {
  get: async (telegramId) => {
    const tid = String(telegramId);
    const row = await db(TABLE).where({ telegram_id: tid }).first();
    if (!row) return null;
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      await db(TABLE).where({ telegram_id: tid }).delete();
      return null;
    }
    return {
      ...row,
      cart_json: row.cart_json || [],
      context_json: row.context_json || {},
    };
  },

  set: async (telegramId, state, cart = [], context = {}) => {
    const tid = String(telegramId);
    const expires_at = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
    const existing = await db(TABLE).where({ telegram_id: tid }).first();
    if (existing) {
      return db(TABLE).where({ telegram_id: tid })
        .update({ state, cart_json: JSON.stringify(cart), context_json: JSON.stringify(context), expires_at, updated_at: db.fn.now() });
    }
    return db(TABLE).insert({ telegram_id: tid, state, cart_json: JSON.stringify(cart), context_json: JSON.stringify(context), expires_at });
  },

  clear: (telegramId) =>
    db(TABLE).where({ telegram_id: String(telegramId) }).delete(),
};
