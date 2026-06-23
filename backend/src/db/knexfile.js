// knexfile.js — Configuración de Knex: connection string, directorio de migrations y seeds
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: { directory: './migrations' },
    seeds: { directory: './seeds' },
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: { directory: './migrations' },
    pool: { min: 2, max: 10 },
  },
};
