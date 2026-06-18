require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const multipart = require('@fastify/multipart');
const staticFiles = require('@fastify/static');
const path = require('path');

const db = require('./db');
const redisClient = require('./redis');
const telegramRoutes = require('./telegram/webhook');
const adminRoutes = require('./api/admin');
const businessRoutes = require('./api/business');

const app = Fastify({ logger: true });

async function bootstrap() {
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB
  await app.register(staticFiles, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
  });

  app.decorate('db', db);
  app.decorate('redis', redisClient);

  await app.register(telegramRoutes, { prefix: '/webhook' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(businessRoutes, { prefix: '/api/business' });

  app.get('/health', async () => ({ status: 'ok' }));

  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  console.log(`Servidor corriendo en ${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
