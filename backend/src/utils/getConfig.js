const db = require('../db');

async function getConfig(key, defaultValue = null) {
  const row = await db('config').where({ key }).first();
  return row?.value ?? defaultValue;
}

module.exports = { getConfig };
