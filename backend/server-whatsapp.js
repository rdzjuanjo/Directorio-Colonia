require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const multipart = require('@fastify/multipart');
const staticFiles = require('@fastify/static');
const path = require('path');

// WhatsApp listener inyecta el sender antes de que cualquier otro módulo lo cargue
const { startWhatsApp } = require('./src/whatsapp/listener');

const db = require('./src/db');
const redisClient = require('./src/redis');
const adminRoutes = require('./src/api/admin');
const businessRoutes = require('./src/api/business');

const app = Fastify({ logger: false });

async function bootstrap() {
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: process.env.JWT_SECRET });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(staticFiles, {
    root: path.join(__dirname, 'uploads'),
    prefix: '/uploads/',
  });

  app.decorate('db', db);
  app.decorate('redis', redisClient);

  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(businessRoutes, { prefix: '/api/business' });

  app.get('/health', async () => ({ status: 'ok', provider: 'whatsapp' }));

  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  console.log(`\n🚀 Servidor corriendo en ${host}:${port}`);
  console.log('📋 Panel admin:    http://localhost:5173');
  console.log('🏪 Panel negocio:  http://localhost:5174\n');

  // Iniciar cliente WhatsApp (muestra QR en terminal)
  startWhatsApp();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
