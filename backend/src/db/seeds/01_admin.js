// 01_admin.js — Seed idempotente: crea usuario admin por defecto e inserta todos los valores de config si no existen
const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  const existing = await knex('admins').where({ email: 'admin@colonia.local' }).first();
  if (!existing) {
    await knex('admins').insert({
      email: 'admin@colonia.local',
      password_hash: await bcrypt.hash('admin1234', 10),
    });
    console.log('Admin creado: admin@colonia.local / admin1234');
  }

  const configDefaults = [
    { key: 'delivery_fee',                   value: '30' },
    { key: 'rider_accept_timeout_minutes',    value: '3' },
    { key: 'payment_timeout_minutes',         value: '30' },
    { key: 'payment_confirm_timeout_minutes', value: '30' },
    { key: 'preparation_timeout_minutes',     value: '90' },
    { key: 'session_ttl_minutes',             value: '60' },
    { key: 'admin_whatsapp_id',               value: '' },
    { key: 'delivery_zone',                   value: '' },
  ];
  for (const row of configDefaults) {
    const has = await knex('config').where({ key: row.key }).first();
    if (!has) await knex('config').insert(row);
  }
};
