// 20240003_rename_telegram_to_whatsapp.js — Renombra telegram_id → whatsapp_id en todas las tablas; migración del canal de Telegram a WhatsApp
exports.up = async function (knex) {
  await knex.schema.table('customers',     (t) => t.renameColumn('telegram_id', 'whatsapp_id'));
  await knex.schema.table('businesses',    (t) => t.renameColumn('telegram_id', 'whatsapp_id'));
  await knex.schema.table('riders',        (t) => t.renameColumn('telegram_id', 'whatsapp_id'));
  await knex.schema.table('conversations', (t) => t.renameColumn('telegram_id', 'whatsapp_id'));
};

exports.down = async function (knex) {
  await knex.schema.table('customers',     (t) => t.renameColumn('whatsapp_id', 'telegram_id'));
  await knex.schema.table('businesses',    (t) => t.renameColumn('whatsapp_id', 'telegram_id'));
  await knex.schema.table('riders',        (t) => t.renameColumn('whatsapp_id', 'telegram_id'));
  await knex.schema.table('conversations', (t) => t.renameColumn('whatsapp_id', 'telegram_id'));
};
