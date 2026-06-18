const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  const existing = await knex('admins').where({ email: 'admin@colonia.local' }).first();
  if (existing) return;
  await knex('admins').insert({
    email: 'admin@colonia.local',
    password_hash: await bcrypt.hash('admin1234', 10),
  });
  console.log('Admin creado: admin@colonia.local / admin1234');
};
