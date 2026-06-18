const path = require('path');
const fs = require('fs');
const db = require('../db');
const menuDb = require('../db/models/menu');
const ordersDb = require('../db/models/orders');
const businessesDb = require('../db/models/businesses');
const { verifyBusinessToken, loginBusiness } = require('./auth');

async function businessRoutes(fastify) {
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body;
    const token = await loginBusiness(fastify, email, password);
    if (!token) return reply.code(401).send({ error: 'Credenciales inválidas' });
    return { token };
  });

  fastify.addHook('preHandler', verifyBusinessToken);

  const bizId = (req) => req.user.role === 'admin' ? req.params.businessId : req.user.business_id;

  // Negocio
  fastify.get('/me', async (req) => businessesDb.findById(bizId(req)));
  fastify.put('/me', async (req) => businessesDb.update(bizId(req), req.body));

  // Menú — categorías
  fastify.get('/menu', async (req) => menuDb.getCategoriesWithItems(bizId(req)));
  fastify.post('/menu/categories', async (req) => menuDb.createCategory({ ...req.body, business_id: bizId(req) }));
  fastify.put('/menu/categories/:id', async (req) => menuDb.updateCategory(req.params.id, req.body));
  fastify.delete('/menu/categories/:id', async (req) => menuDb.deleteCategory(req.params.id));

  // Menú — productos
  fastify.post('/menu/items', async (req) => menuDb.createItem(req.body));
  fastify.put('/menu/items/:id', async (req) => menuDb.updateItem(req.params.id, req.body));
  fastify.delete('/menu/items/:id', async (req) => menuDb.deleteItem(req.params.id));

  // Subir foto de producto
  fastify.post('/menu/items/:id/photo', async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: 'No file' });
    const ext = path.extname(data.filename) || '.jpg';
    const filename = `item_${req.params.id}_${Date.now()}${ext}`;
    const uploadPath = path.join(__dirname, '../../uploads', filename);
    const buffer = await data.toBuffer();
    fs.writeFileSync(uploadPath, buffer);
    const photo_url = `/uploads/${filename}`;
    await menuDb.updateItem(req.params.id, { photo_url });
    return { photo_url };
  });

  // Pedidos
  fastify.get('/orders', async (req) => {
    const { status } = req.query;
    return ordersDb.findByBusiness(bizId(req), status);
  });
  fastify.get('/orders/:id', async (req) => ordersDb.findWithItems(req.params.id));

  fastify.post('/orders/:id/confirm-payment', async (req) => {
    const { transition } = require('../orders/state-machine');
    await transition(req.params.id, 'confirmed');
    return { ok: true };
  });

  fastify.post('/orders/:id/ready', async (req) => {
    const { transition } = require('../orders/state-machine');
    await transition(req.params.id, 'ready');
    return { ok: true };
  });

  fastify.put('/orders/:id/items', async (req) => {
    const { transition } = require('../orders/state-machine');
    await ordersDb.updateItems(req.params.id, req.body.items);
    await transition(req.params.id, 'modified_pending');
    return { ok: true };
  });
}

module.exports = businessRoutes;
