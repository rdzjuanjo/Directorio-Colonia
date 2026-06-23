const db = require('../db');

// Ray-casting algorithm: returns true if (lat, lng) is inside polygon.
// polygon: [[lat, lng], ...]
function pointInPolygon(lat, lng, polygon) {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

async function getDeliveryZone() {
  const row = await db('config').where({ key: 'delivery_zone' }).first();
  if (!row?.value) return null;
  try {
    const zone = JSON.parse(row.value);
    return Array.isArray(zone) && zone.length >= 3 ? zone : null;
  } catch (_) {
    return null;
  }
}

module.exports = { pointInPolygon, getDeliveryZone };
