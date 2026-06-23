const db = require('../db');

async function analyticsQuery(from, to, businessId = null) {
  const params = businessId ? [from, to, businessId] : [from, to];
  const bizWhere = businessId ? 'AND business_id = ?' : '';
  const bizWhereO = businessId ? 'AND o.business_id = ?' : '';

  const [byDay, products] = await Promise.all([
    db.raw(
      `SELECT DATE(created_at)::text AS date, COUNT(*)::int AS orders, SUM(total)::float AS revenue
       FROM orders WHERE created_at::date BETWEEN ? AND ? AND status = 'delivered' ${bizWhere}
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      params,
    ),
    db.raw(
      `SELECT oi.item_name AS name, SUM(oi.quantity)::int AS qty,
              SUM(oi.quantity * oi.unit_price)::float AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at::date BETWEEN ? AND ? AND o.status = 'delivered' ${bizWhereO}
       GROUP BY oi.item_name ORDER BY qty DESC LIMIT 3`,
      params,
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
}

module.exports = { analyticsQuery };
