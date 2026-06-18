const db = require('../index');

const TABLE = 'businesses';

module.exports = {
  findAll: (filters = {}) => db(TABLE).where(filters),

  findById: (id) => db(TABLE).where({ id }).first(),

  findActive: () => db(TABLE).where({ active: true, banned: false }),

  isOpen: (business) => {
    if (!business.hours_json) return true;
    const hours = typeof business.hours_json === 'string'
      ? JSON.parse(business.hours_json)
      : business.hours_json;
    const now = new Date();
    const day = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
    const schedule = hours[day];
    if (!schedule || !schedule.open) return false;
    const [openH, openM] = schedule.from.split(':').map(Number);
    const [closeH, closeM] = schedule.to.split(':').map(Number);
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes >= openH * 60 + openM && minutes <= closeH * 60 + closeM;
  },

  create: (data) => db(TABLE).insert(data).returning('*').then((r) => r[0]),

  update: (id, data) => db(TABLE).where({ id }).update(data).returning('*').then((r) => r[0]),

  delete: (id) => db(TABLE).where({ id }).delete(),
};
