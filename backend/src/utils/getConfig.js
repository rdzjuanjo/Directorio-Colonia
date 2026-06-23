// getConfig.js — Helper para leer la tabla config con valor por defecto; evita crashes si npm run seed no se ejecutó
const db = require('../db');

async function getConfig(key, defaultValue = null) {
  const row = await db('config').where({ key }).first();
  return row?.value ?? defaultValue;
}

module.exports = { getConfig };
