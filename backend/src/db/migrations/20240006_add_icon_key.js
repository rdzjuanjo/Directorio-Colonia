exports.up = (knex) =>
  knex.schema.alterTable('businesses', (t) => {
    t.string('icon_key', 64).nullable();
  });

exports.down = (knex) =>
  knex.schema.alterTable('businesses', (t) => {
    t.dropColumn('icon_key');
  });
