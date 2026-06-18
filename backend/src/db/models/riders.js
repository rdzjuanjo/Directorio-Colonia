const db = require('../index');

const TABLE = 'riders';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = {
  findByTelegramId: (telegramId) =>
    db(TABLE).where({ telegram_id: String(telegramId) }).first(),

  findById: (id) => db(TABLE).where({ id }).first(),

  findAvailable: () =>
    db(TABLE).where({ status: 'waiting', active: true, banned: false }),

  findNearest: async (lat, lng) => {
    const available = await db(TABLE).where({ status: 'waiting', active: true, banned: false });
    if (!available.length) return null;
    return available
      .filter((r) => r.current_lat && r.current_lng)
      .map((r) => ({ ...r, distance: haversineKm(lat, lng, r.current_lat, r.current_lng) }))
      .sort((a, b) => a.distance - b.distance)[0] || null;
  },

  updateLocation: (telegramId, lat, lng) =>
    db(TABLE).where({ telegram_id: String(telegramId) })
      .update({ current_lat: lat, current_lng: lng, last_seen: db.fn.now() }),

  updateStatus: (telegramId, status) =>
    db(TABLE).where({ telegram_id: String(telegramId) }).update({ status }),

  updateStatusById: (id, status) =>
    db(TABLE).where({ id }).update({ status }),

  create: (data) => db(TABLE).insert(data).returning('*').then((r) => r[0]),

  update: (id, data) => db(TABLE).where({ id }).update(data).returning('*').then((r) => r[0]),

  getAll: () => db(TABLE).where({ active: true }),
};
