// redis.js — Cliente Redis compartido; usado para mapas de botones WhatsApp, sets de dispatch y dedup del watchdog
const { createClient } = require('redis');

const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis conectado'));

client.connect().catch(console.error);

module.exports = client;
