const db = require('../index');

module.exports = {
  findByTelegramId: (telegramId) =>
    db('business_users')
      .join('businesses', 'business_users.business_id', 'businesses.id')
      .where('businesses.telegram_id', String(telegramId))
      .select('business_users.*', 'businesses.name as business_name', 'businesses.id as business_id',
        'businesses.clabe', 'businesses.bank_name', 'businesses.account_holder')
      .first(),

  findByEmail: (email) => db('business_users').where({ email }).first(),

  findByBusinessId: (businessId) => db('business_users').where({ business_id: businessId }),

  create: (data) => db('business_users').insert(data).returning('*').then((r) => r[0]),

  update: (id, data) => db('business_users').where({ id }).update(data).returning('*').then((r) => r[0]),
};
