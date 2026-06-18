const bcrypt = require('bcryptjs');
const db = require('../db');
const businessesDb = require('../db/models/businesses');
const ridersDb = require('../db/models/riders');
const ordersDb = require('../db/models/orders');
const disputesDb = require('../db/models/disputes');
const { verifyAdminToken, loginAdmin } = require('./auth');

async function adminRoutes(fastify) {
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body;
    const token = await loginAdmin(fastify, email, password);
    if (!token) return reply.code(401).send({ error: 'Credenciales inválidas' });
    return { token };
  });

  fastify.addHook('preHandler', verifyAdminToken);

  // Negocios
  fastify.get('/businesses', async () => db('businesses').orderBy('name'));
  fastify.post('/businesses', async (req, reply) => {
    const { password, ...bizData } = req.body;
    const biz = await businessesDb.create(bizData);
    if (req.body.email && password) {
      await db('business_users').insert({
        business_id: biz.id, email: req.body.email,
        password_hash: await bcrypt.hash(password, 10),
      });
    }
    return biz;
  });
  fastify.put('/businesses/:id', async (req) => businessesDb.update(req.params.id, req.body));
  fastify.delete('/businesses/:id', async (req) => businessesDb.delete(req.params.id));
  fastify.post('/businesses/:id/ban', async (req) => businessesDb.update(req.params.id, { banned: true }));
  fastify.post('/businesses/:id/unban', async (req) => businessesDb.update(req.params.id, { banned: false }));

  // Repartidores
  fastify.get('/riders', async () => ridersDb.getAll());
  fastify.post('/riders', async (req) => ridersDb.create(req.body));
  fastify.put('/riders/:id', async (req) => ridersDb.update(req.params.id, req.body));
  fastify.post('/riders/:id/ban', async (req) => ridersDb.update(req.params.id, { banned: true }));
  fastify.post('/riders/:id/assign/:orderId', async (req) => {
    const { transition, assignRider } = require('../orders/state-machine');
    await assignRider(parseInt(req.params.orderId), parseInt(req.params.id));
    return { ok: true };
  });

  // Pedidos
  fastify.get('/orders', async () => ordersDb.findActive());
  fastify.get('/orders/all', async (req) => {
    const { status, limit = 50 } = req.query;
    return db('orders').modify((q) => { if (status) q.where({ status }); }).limit(limit).orderBy('created_at', 'desc');
  });
  fastify.get('/orders/:id', async (req) => ordersDb.findWithItems(req.params.id));
  fastify.post('/orders/:id/status', async (req) => {
    const { transition } = require('../orders/state-machine');
    await transition(req.params.id, req.body.status);
    return { ok: true };
  });

  // Disputas
  fastify.get('/disputes', async () => disputesDb.findAll());
  fastify.post('/disputes/:id/resolve', async (req) => disputesDb.resolve(req.params.id));

  // Config
  fastify.get('/config', async () => db('config').select('key', 'value'));
  fastify.put('/config/:key', async (req) => {
    await db('config').where({ key: req.params.key }).update({ value: req.body.value });
    return { ok: true };
  });

  // Dashboard stats
  fastify.get('/stats', async () => {
    const today = new Date().toISOString().split('T')[0];
    const [ordersToday, activeOrders, activeRiders] = await Promise.all([
      db('orders').whereRaw('DATE(created_at) = ?', [today]).count('* as count').first(),
      db('orders').whereNotIn('status', ['delivered', 'cancelled', 'disputed']).count('* as count').first(),
      db('riders').where({ status: 'waiting', active: true }).count('* as count').first(),
    ]);
    return {
      orders_today: parseInt(ordersToday.count),
      active_orders: parseInt(activeOrders.count),
      active_riders: parseInt(activeRiders.count),
    };
  });
}

module.exports = adminRoutes;
