const bcrypt = require('bcryptjs');
const db = require('../db');
const businessesDb = require('../db/models/businesses');
const ridersDb = require('../db/models/riders');
const ordersDb = require('../db/models/orders');
const disputesDb = require('../db/models/disputes');
const { verifyAdminToken, loginAdmin } = require('./auth');

async function adminRoutes(fastify) {
  // Ruta pública — sin autenticación
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body;
    const token = await loginAdmin(fastify, email, password);
    if (!token) return reply.code(401).send({ error: 'Credenciales inválidas' });
    return { token };
  });

  // Todas las rutas siguientes requieren token de admin
  fastify.register(async function protectedRoutes(f) {
    f.addHook('preHandler', verifyAdminToken);

    // Negocios
    f.get('/businesses', async () => db('businesses').orderBy('name'));
    f.post('/businesses', async (req) => {
      const { password, email, ...bizData } = req.body;
      const biz = await businessesDb.create(bizData);
      if (email && password) {
        await db('business_users').insert({
          business_id: biz.id, email,
          password_hash: await bcrypt.hash(password, 10),
        });
      }
      return biz;
    });
    f.put('/businesses/:id', async (req) => businessesDb.update(req.params.id, req.body));
    f.delete('/businesses/:id', async (req) => businessesDb.delete(req.params.id));
    f.post('/businesses/:id/ban', async (req) => businessesDb.update(req.params.id, { banned: true }));
    f.post('/businesses/:id/unban', async (req) => businessesDb.update(req.params.id, { banned: false }));

    // Repartidores
    f.get('/riders', async () => ridersDb.getAll());
    f.post('/riders', async (req) => ridersDb.create(req.body));
    f.put('/riders/:id', async (req) => ridersDb.update(req.params.id, req.body));
    f.post('/riders/:id/ban', async (req) => ridersDb.update(req.params.id, { banned: true }));
    f.post('/riders/:id/assign/:orderId', async (req) => {
      const { assignRider } = require('../orders/state-machine');
      await assignRider(parseInt(req.params.orderId), parseInt(req.params.id));
      return { ok: true };
    });

    // Pedidos
    f.get('/orders', async () => ordersDb.findActive());
    f.get('/orders/all', async (req) => {
      const { status, limit = 50 } = req.query;
      return db('orders').modify((q) => { if (status) q.where({ status }); }).limit(parseInt(limit)).orderBy('created_at', 'desc');
    });
    f.get('/orders/:id', async (req) => ordersDb.findWithItems(req.params.id));
    f.post('/orders/:id/status', async (req) => {
      const { transition } = require('../orders/state-machine');
      await transition(req.params.id, req.body.status);
      return { ok: true };
    });

    // Disputas
    f.get('/disputes', async () => disputesDb.findAll());
    f.post('/disputes/:id/resolve', async (req) => disputesDb.resolve(req.params.id));

    // Config
    f.get('/config', async () => db('config').select('key', 'value'));
    f.put('/config/:key', async (req) => {
      await db('config').where({ key: req.params.key }).update({ value: req.body.value });
      return { ok: true };
    });

    // Dashboard stats
    f.get('/stats', async () => {
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
  });
}

module.exports = adminRoutes;
