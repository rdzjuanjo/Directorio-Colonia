const db = require('../index');

const TABLE = 'customers';

module.exports = {
  findByTelegramId: (telegramId) =>
    db(TABLE).where({ telegram_id: String(telegramId) }).first(),

  create: (data) =>
    db(TABLE).insert(data).returning('*').then((r) => r[0]),

  update: (telegramId, data) =>
    db(TABLE).where({ telegram_id: String(telegramId) }).update(data).returning('*').then((r) => r[0]),
};
