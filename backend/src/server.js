require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const multipart = require('@fastify/multipart');
const staticFiles = require('@fastify/static');
const path = require('path');

const { startWhatsApp } = require('./whatsapp/listener');

const db = require('./db');
const redisClient = require('./redis');
const adminRoutes = require('./api/admin');
const businessRoutes = require('./api/business');
const catalogRoutes = require('./api/catalog');
const webchatRoutes = require('./webchat/routes');

const app = Fastify({ logger: false });

async function bootstrap() {
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(staticFiles, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
  });

  app.decorate('db', db);
  app.decorate('redis', redisClient);

  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(businessRoutes, { prefix: '/api/business' });
  await app.register(catalogRoutes);
  await app.register(webchatRoutes);

  app.get('/health', async () => ({ status: 'ok', provider: 'whatsapp' }));

  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  console.log(`\n🚀 Servidor corriendo en ${host}:${port}`);
  console.log('📋 Panel admin:    http://localhost:5173');
  console.log('🏪 Panel negocio:  http://localhost:5174\n');

  startWhatsApp();

  const { startWatchdog } = require('./jobs/orderWatchdog');
  startWatchdog();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
