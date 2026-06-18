const businessesDb = require('../db/models/businesses');
const menuDb = require('../db/models/menu');

async function catalogRoutes(fastify) {
  fastify.get('/catalog/:businessId', async (req, reply) => {
    const biz = await businessesDb.findById(req.params.businessId);
    if (!biz || biz.banned) return reply.code(404).type('text/html').send('<h1>Negocio no encontrado</h1>');

    const categories = await menuDb.getCategoriesWithItems(req.params.businessId, true);
    const publicUrl = process.env.PUBLIC_URL || '';

    const itemsHtml = categories
      .filter((c) => c.items.length)
      .map((cat) => {
        const items = cat.items.map((item) => {
          const photo = item.photo_url
            ? `<img src="${publicUrl}${item.photo_url}" alt="${esc(item.name)}" style="width:100%;max-width:280px;border-radius:8px;display:block;margin-bottom:8px">`
            : '';
          const desc = item.description ? `<p style="color:#666;font-size:14px;margin:4px 0">${esc(item.description)}</p>` : '';
          return `
            <div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:16px;display:flex;gap:16px;align-items:flex-start">
              ${photo ? `<div style="flex-shrink:0">${photo}</div>` : ''}
              <div style="flex:1">
                <div style="font-weight:600;font-size:16px">${esc(item.name)}</div>
                ${desc}
                <div style="color:#e07000;font-weight:700;font-size:18px;margin-top:6px">$${parseFloat(item.price).toFixed(2)}</div>
              </div>
            </div>`;
        }).join('');
        return `<h2 style="margin:24px 0 12px;font-size:18px;border-bottom:2px solid #e07000;padding-bottom:6px">${esc(cat.name)}</h2><div style="display:flex;flex-direction:column;gap:12px">${items}</div>`;
      }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(biz.name)} — Catálogo</title>
<style>body{font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:16px;background:#f9f9f9}h1{margin:0 0 4px}p.cat{color:#666;margin:0 0 8px}</style>
</head>
<body>
<h1>${esc(biz.name)}</h1>
<p class="cat">${esc(biz.category)}${biz.description ? ' · ' + esc(biz.description) : ''}</p>
${biz.address_text ? `<p style="color:#555;font-size:14px">📍 ${esc(biz.address_text)}</p>` : ''}
${itemsHtml || '<p style="color:#999">Este negocio no tiene productos disponibles.</p>'}
</body>
</html>`;

    reply.type('text/html').send(html);
  });
}

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = catalogRoutes;
