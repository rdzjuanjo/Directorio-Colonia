// index.js — Instancia de Knex conectada a PostgreSQL via DATABASE_URL; importado por todos los modelos y rutas de API
const knex = require('knex');
const config = require('./knexfile');

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env]);

module.exports = db;
