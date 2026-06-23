/**
 * Elimina todos los negocios demo de la base de datos.
 * Úsalo cuando quieras pasar a datos reales de producción.
 *
 * Las FKs con onDelete('CASCADE') eliminan automáticamente:
 *   business_users, menu_categories, menu_items
 *
 * Uso: npm run seed:clean
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });

const db   = require('../../db');
const redis = require('../../redis');

async function cleanDemo() {
  const DEMO_PREFIX = '5213300000';

  const toDelete = await db('businesses')
    .where('whatsapp_id', 'like', `${DEMO_PREFIX}%`)
    .select('id', 'name', 'whatsapp_id');

  if (!toDelete.length) {
    console.log('ℹ️  No se encontraron negocios demo en la base de datos.');
    return;
  }

  const deleted = await db('businesses')
    .where('whatsapp_id', 'like', `${DEMO_PREFIX}%`)
    .delete();

  // Invalidar cache del catálogo en Redis
  try {
    await redis.del('catalog:snapshot');
    console.log('🗑️  Cache del catálogo invalidada.');
  } catch (_) {}

  console.log(`✅ ${deleted} negocio(s) demo eliminado(s):`);
  for (const b of toDelete) {
    console.log(`   - ${b.name} (${b.whatsapp_id})`);
  }
}

cleanDemo()
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => { db.destroy(); redis.quit().catch(() => {}); });
