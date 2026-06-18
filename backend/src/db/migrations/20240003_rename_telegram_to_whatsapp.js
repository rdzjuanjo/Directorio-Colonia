exports.up = async function (knex) {
  await knex.schema.table('customers',     (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
  await knex.schema.table('businesses',    (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
  await knex.schema.table('riders',        (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
  await knex.schema.table('conversations', (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
};

exports.down = async function (knex) {
  await knex.schema.table('customers',     (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
  await knex.schema.table('businesses',    (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
  await knex.schema.table('riders',        (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
  await knex.schema.table('conversations', (t) => t.renameColumn('whatsapp_id', 'whatsapp_id'));
};
