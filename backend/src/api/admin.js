// admin.js — Rutas protegidas de administrador: negocios, repartidores, pedidos, config, analíticas y clientes
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

    // Analíticas del bot catálogo
    f.get('/catalog-analytics', async (req, reply) => {
      const { from, to } = req.query;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return reply.code(400).send({ error: 'from y to deben tener formato YYYY-MM-DD' });
      }

      const [totalsRows, byDay, topBizRows, topQueryRows] = await Promise.all([
        db('bot_catalog_events')
          .whereRaw('created_at::date BETWEEN ? AND ?', [from, to])
          .select(
            db.raw('COUNT(*) FILTER (WHERE event_type = \'search\')::int AS searches'),
            db.raw('COUNT(DISTINCT whatsapp_id) FILTER (WHERE event_type = \'search\')::int AS unique_users'),
            db.raw('COUNT(*) FILTER (WHERE event_type = \'business_viewed\')::int AS business_views'),
            db.raw('COUNT(*) FILTER (WHERE event_type = \'contact_shared\')::int AS contacts_shared')
          )
          .first(),
        db('bot_catalog_events')
          .whereRaw('created_at::date BETWEEN ? AND ?', [from, to])
          .where('event_type', 'search')
          .select(db.raw('DATE(created_at)::text AS date'), db.raw('COUNT(*)::int AS count'))
          .groupBy(db.raw('DATE(created_at)'))
          .orderBy('date'),
        db('bot_catalog_events as e')
          .join('businesses as b', 'e.business_id', 'b.id')
          .whereRaw('e.created_at::date BETWEEN ? AND ?', [from, to])
          .whereIn('e.event_type', ['business_viewed', 'contact_shared'])
          .select(
            'b.id',
            'b.name',
            db.raw('COUNT(*) FILTER (WHERE e.event_type = \'business_viewed\')::int AS views'),
            db.raw('COUNT(*) FILTER (WHERE e.event_type = \'contact_shared\')::int AS contacts')
          )
          .groupBy('b.id', 'b.name')
          .orderBy('views', 'desc')
          .limit(5),
        db('bot_catalog_events')
          .whereRaw('created_at::date BETWEEN ? AND ?', [from, to])
          .where('event_type', 'search')
          .whereNotNull('query_text')
          .select('query_text AS query', db.raw('COUNT(*)::int AS count'))
          .groupBy('query_text')
          .orderBy('count', 'desc')
          .limit(10),
      ]);

      return {
        totals: totalsRows || { searches: 0, unique_users: 0, business_views: 0, contacts_shared: 0 },
        searchesByDay: byDay,
        topBusinesses: topBizRows,
        topQueries: topQueryRows,
      };
    });

    // Clientes / usuarios del bot
    f.get('/customers', async () => {
      const rows = await db('customers')
        .select('id', 'whatsapp_id', 'name', 'banned', 'created_at')
        .orderBy('created_at', 'desc');
      return rows.map((r) => ({ ...r, phone: r.whatsapp_id?.split('@')[0] || r.whatsapp_id }));
    });

    f.get('/customers/stats', async (req, reply) => {
      const { from, to } = req.query;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return reply.code(400).send({ error: 'from y to deben tener formato YYYY-MM-DD' });
      }
      const [total, byDay] = await Promise.all([
        db('customers').count('* as count').first(),
        db('customers')
          .whereRaw('created_at::date BETWEEN ? AND ?', [from, to])
          .select(db.raw('DATE(created_at)::text AS date'), db.raw('COUNT(*)::int AS count'))
          .groupBy(db.raw('DATE(created_at)'))
          .orderBy('date'),
      ]);
      return { total: parseInt(total.count), byDay };
    });

    // Analíticas de pedidos
    f.get('/analytics', async (req, reply) => {
      const { from, to } = req.query;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return reply.code(400).send({ error: 'from y to deben tener formato YYYY-MM-DD' });
      }
      const { analyticsQuery } = require('./analyticsHelper');
      return analyticsQuery(from, to);
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
