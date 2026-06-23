// 20240002_add_pickup.js — Agrega soporte de retiro en tienda: columnas delivery_type, payment_method y accepts_pickup
exports.up = async function (knex) {
  await knex.schema.table('orders', (t) => {
    t.string('delivery_type').defaultTo('delivery');   // 'delivery' | 'pickup'
    t.string('payment_method').defaultTo('transfer');  // 'transfer' | 'at_store'
  });

  await knex.schema.table('businesses', (t) => {
    t.boolean('accepts_pickup').defaultTo(true);
    t.string('address_text');
  });
};

exports.down = async function (knex) {
  await knex.schema.table('orders', (t) => {
    t.dropColumns('delivery_type', 'payment_method');
  });
  await knex.schema.table('businesses', (t) => {
    t.dropColumns('accepts_pickup', 'address_text');
  });
};
