// business.js — Rutas protegidas de negocio: menú (categorías/ítems/fotos), horarios, pedidos y recuperación de contraseña
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../db');
const menuDb = require('../db/models/menu');
const ordersDb = require('../db/models/orders');
const businessesDb = require('../db/models/businesses');
const { verifyBusinessToken, loginBusiness } = require('./auth');
const redis = require('../redis');
const sender = require('../sender');

async function businessRoutes(fastify) {
  // Ruta pública — sin autenticación
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body;
    const token = await loginBusiness(fastify, email, password);
    if (!token) return reply.code(401).send({ error: 'Credenciales inválidas' });
    return { token };
  });

  fastify.post('/forgot-password', async (req, reply) => {
    const { email } = req.body || {};
    if (!email) return reply.code(400).send({ error: 'Email requerido' });

    const user = await db('business_users').where({ email }).first();
    if (!user) return { ok: true }; // no revelar si existe o no

    const business = await db('businesses').where({ id: user.business_id }).first();
    if (!business?.whatsapp_id) return { ok: true };

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await redis.set(`reset:biz:${code}`, String(user.id), { EX: 900 });

    const phone = business.whatsapp_id.split('@')[0];
    await sender.sendText(`${phone}@c.us`, `Tu código de recuperación de contraseña es: *${code}*\nVálido por 15 minutos.`);

    return { ok: true };
  });

  fastify.post('/reset-password', async (req, reply) => {
    const { code, newPassword } = req.body || {};
    if (!code || !newPassword) return reply.code(400).send({ error: 'Código y nueva contraseña requeridos' });
    if (newPassword.length < 6) return reply.code(400).send({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const userId = await redis.get(`reset:biz:${code}`);
    if (!userId) return reply.code(400).send({ error: 'Código inválido o expirado' });

    const hash = await bcrypt.hash(newPassword, 10);
    await db('business_users').where({ id: Number(userId) }).update({ password_hash: hash });
    await redis.del(`reset:biz:${code}`);

    return { ok: true };
  });

  // Todas las rutas siguientes requieren token
  fastify.register(async function protectedRoutes(f) {
    f.addHook('preHandler', verifyBusinessToken);

    const bizId = (req) => req.user.role === 'admin' ? req.params.businessId : req.user.business_id;

    // Negocio
    f.get('/me', async (req) => businessesDb.findById(bizId(req)));
    f.put('/me', async (req) => businessesDb.update(bizId(req), req.body));

    // Menú — categorías
    f.get('/menu', async (req) => menuDb.getCategoriesWithItems(bizId(req)));
    f.post('/menu/categories', async (req) => menuDb.createCategory({ ...req.body, business_id: bizId(req) }));
    f.put('/menu/categories/:id', async (req, reply) => {
      if (!await menuDb.categoryBelongsTo(req.params.id, bizId(req))) return reply.code(403).send({ error: 'Forbidden' });
      return menuDb.updateCategory(req.params.id, req.body);
    });
    f.delete('/menu/categories/:id', async (req, reply) => {
      if (!await menuDb.categoryBelongsTo(req.params.id, bizId(req))) return reply.code(403).send({ error: 'Forbidden' });
      return menuDb.deleteCategory(req.params.id);
    });

    // Menú — productos
    f.post('/menu/items', async (req, reply) => {
      if (!await menuDb.categoryBelongsTo(req.body.category_id, bizId(req))) return reply.code(403).send({ error: 'Forbidden' });
      return menuDb.createItem({ ...req.body, business_id: undefined });
    });
    f.put('/menu/items/:id', async (req, reply) => {
      if (!await menuDb.itemBelongsTo(req.params.id, bizId(req))) return reply.code(403).send({ error: 'Forbidden' });
      return menuDb.updateItem(req.params.id, req.body);
    });
    f.delete('/menu/items/:id', async (req, reply) => {
      if (!await menuDb.itemBelongsTo(req.params.id, bizId(req))) return reply.code(403).send({ error: 'Forbidden' });
      return menuDb.deleteItem(req.params.id);
    });

    // Subir foto de producto
    f.post('/menu/items/:id/photo', async (req, reply) => {
      const data = await req.file();
      if (!data) return reply.code(400).send({ error: 'No file' });
      const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
      const ext = path.extname(data.filename).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) return reply.code(400).send({ error: 'Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP.' });
      const filename = `item_${req.params.id}_${Date.now()}${ext}`;
      const uploadPath = path.join(__dirname, '../../uploads', filename);
      const buffer = await data.toBuffer();
      fs.writeFileSync(uploadPath, buffer);
      const photo_url = `/uploads/${filename}`;
      await menuDb.updateItem(req.params.id, { photo_url });
      return { photo_url };
    });

    // Pedidos
    f.get('/orders', async (req) => {
      const { status } = req.query;
      return ordersDb.findByBusiness(bizId(req), status);
    });
    f.get('/orders/:id', async (req) => ordersDb.findWithItems(req.params.id));

    f.post('/orders/:id/confirm-payment', async (req) => {
      const { transition } = require('../orders/state-machine');
      await transition(req.params.id, 'confirmed');
      return { ok: true };
    });

    f.post('/orders/:id/ready', async (req) => {
      const { transition } = require('../orders/state-machine');
      await transition(req.params.id, 'ready');
      return { ok: true };
    });

    // Analíticas
    f.get('/analytics', async (req, reply) => {
      const { from, to } = req.query;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return reply.code(400).send({ error: 'from y to deben tener formato YYYY-MM-DD' });
      }
      const { analyticsQuery } = require('./analyticsHelper');
      return analyticsQuery(from, to, bizId(req));
    });

    f.put('/orders/:id/items', async (req) => {
      const { transition } = require('../orders/state-machine');
      await ordersDb.updateItems(req.params.id, req.body.items);
      await transition(req.params.id, 'modified_pending');
      return { ok: true };
    });
  });
}

module.exports = businessRoutes;
