// Migration 20240003 was a no-op (renamed whatsapp_id → whatsapp_id by mistake).
// This migration safely renames any remaining telegram_id columns on existing DBs.
exports.up = async function (knex) {
  const tables = ['customers', 'businesses', 'riders', 'conversations'];
  for (const table of tables) {
    const hasOld = await knex.schema.hasColumn(table, 'telegram_id');
    if (hasOld) {
      await knex.schema.table(table, (t) => t.renameColumn('telegram_id', 'whatsapp_id'));
    }
  }
};

exports.down = async function (knex) {
  const tables = ['customers', 'businesses', 'riders', 'conversations'];
  for (const table of tables) {
    const hasCurrent = await knex.schema.hasColumn(table, 'whatsapp_id');
    if (hasCurrent) {
      await knex.schema.table(table, (t) => t.renameColumn('whatsapp_id', 'telegram_id'));
    }
  }
};
