const businessesDb = require('../db/models/businesses');
const menuDb = require('../db/models/menu');
const { getRegistry, getIcon } = require('../utils/businessIcons');

const CATEGORY_ORDER = ['comida', 'abarrotes', 'carniceria', 'panaderia', 'farmacia', 'miscelanea'];
const CATEGORY_LABELS = {
  comida: '🍕 Comida preparada',
  abarrotes: '🛒 Abarrotes',
  carniceria: '🥩 Carnicería',
  panaderia: '🥖 Panadería',
  farmacia: '💊 Farmacia',
  miscelanea: '🏪 Miscelánea',
};

async function catalogRoutes(fastify) {
  // Registro público de íconos SVG
  fastify.get('/icons', async (req, reply) => {
    reply.header('Cache-Control', 'public, max-age=3600');
    reply.send(getRegistry());
  });

  // Mapa público de negocios
  fastify.get('/mapa', async (req, reply) => {
    const publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const allActive = await businessesDb.findActive();
    const registry = getRegistry();

    const mapped = allActive
      .filter((b) => b.lat != null && b.lng != null)
      .map((b) => {
        const icon = getIcon(b.icon_key, b.category);
        return {
          id: b.id,
          name: b.name,
          category: b.category,
          icon_key: b.icon_key || null,
          address_text: b.address_text || null,
          phone: b.whatsapp_id ? b.whatsapp_id.split('@')[0] : null,
          lat: parseFloat(b.lat),
          lng: parseFloat(b.lng),
          catalogUrl: `${publicUrl}/catalog/${b.id}`,
          iconColor: icon.color,
          iconSvg: icon.svg,
        };
      });

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mapa de negocios — La Colonia</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;height:100vh}
  header{padding:10px 16px;background:#1f2937;color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px;flex-shrink:0}
  #map{flex:1}
  .biz-pin{border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer}
  .biz-pin svg{width:20px;height:20px;color:#fff;fill:#fff}
  .popup-wrap{min-width:190px;font-family:system-ui,sans-serif}
  .popup-name{font-weight:700;font-size:15px;margin-bottom:2px}
  .popup-cat{color:#888;font-size:12px;margin-bottom:6px;text-transform:capitalize}
  .popup-addr{color:#666;font-size:12px;margin-bottom:8px}
  .popup-actions{display:flex;flex-direction:column;gap:5px}
  .popup-actions a{font-size:13px;font-weight:600;text-decoration:none;padding:5px 10px;border-radius:6px;display:block;text-align:center}
  .btn-menu{background:#fff3e0;color:#e07000}
  .btn-contact{background:#e8f5e9;color:#2e7d32}
  .btn-order{background:#f5f5f5;color:#bbb;cursor:not-allowed;font-size:13px;font-weight:600;padding:5px 10px;border-radius:6px;display:block;text-align:center}
</style>
</head>
<body>
<header>🗺️ Negocios de la colonia <span style="font-weight:400;opacity:.7;font-size:13px">${mapped.length} en el mapa</span></header>
<div id="map"></div>
<script>
window._BIZ=${JSON.stringify(mapped)};
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/overlapping-marker-spiderfier-leaflet/dist/oms.min.js"></script>
<script>
(function(){
  var CENTER=[20.6422,-103.3122];
  var map=L.map('map',{center:CENTER,zoom:15});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap contributors',maxZoom:19
  }).addTo(map);

  var oms=new OverlappingMarkerSpiderfier(map,{
    markersWontMove:true,
    markersWontHide:true,
    basicFormatEvents:true,
    keepSpiderfied:true,
    nearbyDistance:30,
  });

  window._BIZ.forEach(function(b){
    var icon=L.divIcon({
      html:'<div class="biz-pin" style="width:36px;height:36px;background:'+b.iconColor+'">'+b.iconSvg+'</div>',
      className:'',iconSize:[36,36],iconAnchor:[18,18],popupAnchor:[0,-20]
    });
    var addr=b.address_text?'<div class="popup-addr">📍 '+b.address_text+'</div>':'';
    var contact=b.phone
      ?'<a class="btn-contact" href="https://wa.me/'+b.phone+'" target="_blank">💬 Contactar</a>'
      :'';
    var popup=L.popup().setContent('<div class="popup-wrap">'+
      '<div class="popup-name">'+b.name+'</div>'+
      '<div class="popup-cat">'+b.category+'</div>'+
      addr+
      '<div class="popup-actions">'+
      '<a class="btn-menu" href="'+b.catalogUrl+'" target="_blank">🍽 Ver menú</a>'+
      contact+
      '<span class="btn-order">🛒 Ordenar (próximamente)</span>'+
      '</div></div>');
    var marker=L.marker([b.lat,b.lng],{icon:icon});
    marker._popup=popup;
    oms.addMarker(marker);
    marker.addTo(map);
  });

  oms.addListener('click',function(marker){
    marker._popup.setLatLng(marker.getLatLng()).openOn(map);
  });

  if(window._BIZ.length>1){
    var lls=window._BIZ.map(function(b){return[b.lat,b.lng];});
    map.fitBounds(lls,{padding:[40,40],maxZoom:16});
  }
})();
</script>
</body>
</html>`;

    reply.type('text/html').send(html);
  });

  // Directorio público de todos los negocios
  fastify.get('/directorio', async (req, reply) => {
    const allBizs = await businessesDb.findActive();
    const publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';

    // Agrupar por categoría respetando el orden definido
    const grouped = {};
    for (const biz of allBizs) {
      const cat = biz.category || 'miscelanea';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(biz);
    }

    const categorySections = CATEGORY_ORDER
      .filter((cat) => grouped[cat]?.length)
      .map((cat) => {
        const bizCards = grouped[cat].map((biz) => {
          const phone = biz.whatsapp_id ? biz.whatsapp_id.split('@')[0] : null;
          const phoneHtml = phone
            ? `<a href="https://wa.me/${phone}" style="color:#25d366;text-decoration:none;font-weight:600">
                 💬 Contactar por WhatsApp
               </a>`
            : '';
          const catalogLink = `<a href="${publicUrl}/catalog/${biz.id}"
            style="color:#e07000;text-decoration:none;font-weight:600">📋 Ver catálogo</a>`;
          const desc = biz.description
            ? `<p style="color:#555;font-size:14px;margin:4px 0">${esc(biz.description)}</p>` : '';
          const addr = biz.address_text
            ? `<p style="color:#888;font-size:13px;margin:4px 0">📍 ${esc(biz.address_text)}</p>` : '';
          return `
            <div style="background:#fff;border:1px solid #eee;border-radius:12px;padding:16px;margin-bottom:12px">
              <div style="font-size:17px;font-weight:700;margin-bottom:4px">${esc(biz.name)}</div>
              ${desc}${addr}
              <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">
                ${phoneHtml}
                ${catalogLink}
              </div>
            </div>`;
        }).join('');
        return `<h2 style="font-size:18px;margin:28px 0 12px;padding-bottom:6px;border-bottom:2px solid #e07000">${CATEGORY_LABELS[cat] || cat}</h2>${bizCards}`;
      }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Directorio de negocios — La Colonia</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:640px;margin:0 auto;padding:16px;background:#f9f9f9}
  h1{margin:0 0 4px}
  .subtitle{color:#666;font-size:15px;margin:0 0 24px}
</style>
</head>
<body>
<h1>🏘️ Directorio de la colonia</h1>
<p class="subtitle">Todos los negocios locales en un solo lugar</p>
${categorySections || '<p style="color:#999">No hay negocios disponibles por ahora.</p>'}
</body>
</html>`;

    reply.type('text/html').send(html);
  });

  fastify.get('/catalog/:businessId', async (req, reply) => {
    const biz = await businessesDb.findById(req.params.businessId);
    if (!biz || biz.banned) return reply.code(404).type('text/html').send('<h1>Negocio no encontrado</h1>');

    const categories = await menuDb.getCategoriesWithItems(req.params.businessId, true);
    const publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';

    const itemsHtml = categories
      .filter((c) => c.items.length)
      .map((cat) => {
        const items = cat.items.map((item) => {
          const resolvedPhoto = item.photo_url
            ? (item.photo_url.startsWith('http') ? item.photo_url : `${publicUrl}${item.photo_url}`)
            : null;
          const photo = resolvedPhoto
            ? `<img src="${resolvedPhoto}" alt="${esc(item.name)}" style="width:100%;max-width:280px;border-radius:8px;display:block;margin-bottom:8px">`
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
