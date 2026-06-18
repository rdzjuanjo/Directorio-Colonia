const path = require('path');
const fs = require('fs');
const db = require('../db');
const menuDb = require('../db/models/menu');
const ordersDb = require('../db/models/orders');
const businessesDb = require('../db/models/businesses');
const { verifyBusinessToken, loginBusiness } = require('./auth');

async function businessRoutes(fastify) {
  // Ruta pública — sin autenticación
  fastify.post('/login', async (req, reply) => {
    const { email, password } = req.body;
    const token = await loginBusiness(fastify, email, password);
    if (!token) return reply.code(401).send({ error: 'Credenciales inválidas' });
    return { token };
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
    f.put('/menu/categories/:id', async (req) => menuDb.updateCategory(req.params.id, req.body));
    f.delete('/menu/categories/:id', async (req) => menuDb.deleteCategory(req.params.id));

    // Menú — productos
    f.post('/menu/items', async (req) => menuDb.createItem(req.body));
    f.put('/menu/items/:id', async (req) => menuDb.updateItem(req.params.id, req.body));
    f.delete('/menu/items/:id', async (req) => menuDb.deleteItem(req.params.id));

    // Subir foto de producto
    f.post('/menu/items/:id/photo', async (req, reply) => {
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
      const id = bizId(req);
      const [byDay, products] = await Promise.all([
        db.raw(
          `SELECT DATE(created_at)::text AS date, COUNT(*)::int AS orders, SUM(total)::float AS revenue
           FROM orders WHERE created_at::date BETWEEN ? AND ? AND status = 'delivered' AND business_id = ?
           GROUP BY DATE(created_at) ORDER BY date ASC`,
          [from, to, id],
        ),
        db.raw(
          `SELECT oi.item_name AS name, SUM(oi.quantity)::int AS qty,
                  SUM(oi.quantity * oi.unit_price)::float AS revenue
           FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE o.created_at::date BETWEEN ? AND ? AND o.status = 'delivered' AND o.business_id = ?
           GROUP BY oi.item_name ORDER BY qty DESC LIMIT 3`,
          [from, to, id],
        ),
      ]);
      const days = byDay.rows;
      const totalOrders = days.reduce((s, d) => s + d.orders, 0);
      const totalRevenue = days.reduce((s, d) => s + (d.revenue || 0), 0);
      return {
        ordersByDay: days,
        topProducts: products.rows,
        totals: {
          orders: totalOrders,
          revenue: parseFloat(totalRevenue.toFixed(2)),
          avg_ticket: totalOrders ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0,
        },
      };
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
