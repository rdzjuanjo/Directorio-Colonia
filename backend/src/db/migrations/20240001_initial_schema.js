exports.up = async function (knex) {
  await knex.schema.createTable('admins', (t) => {
    t.increments('id');
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('customers', (t) => {
    t.increments('id');
    t.string('telegram_id').notNullable().unique();
    t.string('name').notNullable();
    t.decimal('default_lat', 10, 8);
    t.decimal('default_lng', 11, 8);
    t.string('default_address_label');
    t.boolean('banned').defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('businesses', (t) => {
    t.increments('id');
    t.string('name').notNullable();
    t.string('category').notNullable();
    t.text('description');
    t.string('clabe', 18).notNullable();
    t.string('bank_name').notNullable();
    t.string('account_holder').notNullable();
    t.string('telegram_id');
    t.jsonb('hours_json').defaultTo('{}');
    t.boolean('active').defaultTo(true);
    t.decimal('lat', 10, 8);
    t.decimal('lng', 11, 8);
    t.boolean('banned').defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('business_users', (t) => {
    t.increments('id');
    t.integer('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('menu_categories', (t) => {
    t.increments('id');
    t.integer('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    t.string('name').notNullable();
    t.integer('sort_order').defaultTo(0);
    t.boolean('active').defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('menu_items', (t) => {
    t.increments('id');
    t.integer('category_id').notNullable().references('id').inTable('menu_categories').onDelete('CASCADE');
    t.string('name').notNullable();
    t.text('description');
    t.decimal('price', 10, 2).notNullable();
    t.string('photo_url');
    t.boolean('available').defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('riders', (t) => {
    t.increments('id');
    t.string('name').notNullable();
    t.string('telegram_id').notNullable().unique();
    t.enum('status', ['off_duty', 'waiting', 'going_to_business', 'waiting_at_business', 'delivering']).defaultTo('off_duty');
    t.decimal('current_lat', 10, 8);
    t.decimal('current_lng', 11, 8);
    t.timestamp('last_seen');
    t.boolean('active').defaultTo(true);
    t.boolean('banned').defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('orders', (t) => {
    t.increments('id');
    t.integer('customer_id').notNullable().references('id').inTable('customers');
    t.integer('business_id').notNullable().references('id').inTable('businesses');
    t.integer('rider_id').references('id').inTable('riders');
    t.enum('status', [
      'draft', 'pending_payment', 'payment_claimed', 'confirmed',
      'preparing', 'modified_pending', 'ready', 'rider_assigned',
      'in_delivery', 'delivered', 'cancelled', 'disputed',
    ]).defaultTo('draft');
    t.decimal('subtotal', 10, 2).notNullable();
    t.decimal('delivery_fee', 10, 2).notNullable().defaultTo(20);
    t.decimal('total', 10, 2).notNullable();
    t.text('address_text');
    t.decimal('address_lat', 10, 8);
    t.decimal('address_lng', 11, 8);
    t.text('notes');
    t.timestamp('rider_assigned_at');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('order_items', (t) => {
    t.increments('id');
    t.integer('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.integer('item_id').references('id').inTable('menu_items');
    t.string('item_name').notNullable();
    t.integer('quantity').notNullable().defaultTo(1);
    t.decimal('unit_price', 10, 2).notNullable();
  });

  await knex.schema.createTable('conversations', (t) => {
    t.increments('id');
    t.string('telegram_id').notNullable().unique();
    t.string('state').notNullable().defaultTo('idle');
    t.jsonb('cart_json').defaultTo('[]');
    t.jsonb('context_json').defaultTo('{}');
    t.timestamp('expires_at');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('dispute_logs', (t) => {
    t.increments('id');
    t.integer('order_id').references('id').inTable('orders');
    t.string('type').notNullable();
    t.text('description');
    t.string('reported_by');
    t.boolean('resolved').defaultTo(false);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('config', (t) => {
    t.string('key').primary();
    t.text('value');
    t.timestamps(true, true);
  });

  await knex('config').insert([
    { key: 'delivery_fee', value: '20' },
    { key: 'rider_accept_timeout_minutes', value: '3' },
    { key: 'payment_confirm_timeout_minutes', value: '30' },
    { key: 'session_ttl_minutes', value: '30' },
  ]);
};

exports.down = async function (knex) {
  for (const table of [
    'dispute_logs', 'conversations', 'order_items', 'orders',
    'riders', 'menu_items', 'menu_categories', 'business_users',
    'businesses', 'customers', 'admins', 'config',
  ]) {
    await knex.schema.dropTableIfExists(table);
  }
};
