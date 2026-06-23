exports.up = async function (knex) {
  await knex.schema.createTable('bot_catalog_events', (t) => {
    t.increments('id');
    t.string('event_type').notNullable(); // 'search' | 'business_viewed' | 'contact_shared'
    t.string('whatsapp_id').notNullable();
    t.integer('business_id').references('id').inTable('businesses').onDelete('SET NULL');
    t.text('query_text'); // solo en event_type='search'
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex.schema.table('bot_catalog_events', (t) => {
    t.index(['event_type', 'created_at']);
    t.index('business_id');
  });
};

exports.down = (knex) => knex.schema.dropTableIfExists('bot_catalog_events');
