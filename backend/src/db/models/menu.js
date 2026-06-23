// menu.js — Modelo de menú: categorías e ítems con fotos; helpers de ownership categoryBelongsTo() e itemBelongsTo() para seguridad
const db = require('../index');

module.exports = {
  getCategoriesWithItems: async (businessId, onlyAvailable = false) => {
    const categories = await db('menu_categories')
      .where({ business_id: businessId, active: true })
      .orderBy('sort_order');

    const items = await db('menu_items')
      .join('menu_categories', 'menu_items.category_id', 'menu_categories.id')
      .where('menu_categories.business_id', businessId)
      .modify((q) => { if (onlyAvailable) q.where('menu_items.available', true); })
      .select('menu_items.*');

    return categories.map((cat) => ({
      ...cat,
      items: items.filter((i) => i.category_id === cat.id),
    }));
  },

  findItemById: (id) => db('menu_items').where({ id }).first(),

  categoryBelongsTo: async (categoryId, businessId) => {
    const row = await db('menu_categories').where({ id: categoryId, business_id: businessId }).first();
    return !!row;
  },

  itemBelongsTo: async (itemId, businessId) => {
    const row = await db('menu_items')
      .join('menu_categories', 'menu_items.category_id', 'menu_categories.id')
      .where({ 'menu_items.id': itemId, 'menu_categories.business_id': businessId })
      .first();
    return !!row;
  },

  createCategory: (data) => db('menu_categories').insert(data).returning('*').then((r) => r[0]),
  updateCategory: (id, data) => db('menu_categories').where({ id }).update(data).returning('*').then((r) => r[0]),
  deleteCategory: (id) => db('menu_categories').where({ id }).delete(),

  createItem: (data) => db('menu_items').insert(data).returning('*').then((r) => r[0]),
  updateItem: (id, data) => db('menu_items').where({ id }).update(data).returning('*').then((r) => r[0]),
  deleteItem: (id) => db('menu_items').where({ id }).delete(),
};
