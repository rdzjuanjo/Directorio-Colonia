// 20240006_add_icon_key.js — Agrega la columna icon_key a la tabla businesses para el selector de ícono SVG
exports.up = (knex) =>
  knex.schema.alterTable('businesses', (t) => {
    t.string('icon_key', 64).nullable();
  });

exports.down = (knex) =>
  knex.schema.alterTable('businesses', (t) => {
    t.dropColumn('icon_key');
  });
