/**
 * Datos DEMO para probar el bot catálogo.
 *
 * Todos los negocios demo usan whatsapp_id con prefijo 5213300000
 * para poder identificarlos y eliminarlos con `npm run seed:clean`.
 *
 * Para limpiar: npm run seed:clean
 * Para recargar: npm run seed:demo
 */

const bcrypt = require('bcryptjs');

// ─── Horarios tipo ──────────────────────────────────────────────────────────

const LUNES_SAB_9_21 = {
  mon: { open: true,  from: '09:00', to: '21:00' },
  tue: { open: true,  from: '09:00', to: '21:00' },
  wed: { open: true,  from: '09:00', to: '21:00' },
  thu: { open: true,  from: '09:00', to: '21:00' },
  fri: { open: true,  from: '09:00', to: '21:00' },
  sat: { open: true,  from: '09:00', to: '21:00' },
  sun: { open: false, from: '10:00', to: '15:00' },
};

const TODOS_8_20 = {
  mon: { open: true, from: '08:00', to: '20:00' },
  tue: { open: true, from: '08:00', to: '20:00' },
  wed: { open: true, from: '08:00', to: '20:00' },
  thu: { open: true, from: '08:00', to: '20:00' },
  fri: { open: true, from: '08:00', to: '20:00' },
  sat: { open: true, from: '08:00', to: '20:00' },
  sun: { open: true, from: '09:00', to: '15:00' },
};

const MADRUGADORES = {
  mon: { open: true, from: '07:00', to: '15:00' },
  tue: { open: true, from: '07:00', to: '15:00' },
  wed: { open: true, from: '07:00', to: '15:00' },
  thu: { open: true, from: '07:00', to: '15:00' },
  fri: { open: true, from: '07:00', to: '15:00' },
  sat: { open: true, from: '07:00', to: '14:00' },
  sun: { open: false, from: '08:00', to: '12:00' },
};

const FARMACIA_HORARIO = {
  mon: { open: true, from: '08:00', to: '22:00' },
  tue: { open: true, from: '08:00', to: '22:00' },
  wed: { open: true, from: '08:00', to: '22:00' },
  thu: { open: true, from: '08:00', to: '22:00' },
  fri: { open: true, from: '08:00', to: '22:00' },
  sat: { open: true, from: '09:00', to: '21:00' },
  sun: { open: true, from: '10:00', to: '18:00' },
};

// ─── Definición de negocios demo ────────────────────────────────────────────

const DEMO_BUSINESSES = [
  {
    biz: {
      name:            'Tacos El Paisa',
      category:        'comida',
      description:     'Tacos y antojitos mexicanos. Sabor casero desde 1995.',
      whatsapp_id:     '52133000001@c.us',
      address_text:    'Calle Independencia 45, Col. Centro, Tlaquepaque',
      lat:             20.6423,
      lng:             -103.3115,
      accepts_pickup:  true,
      active:          true,
      banned:          false,
      clabe:           '000000000000000000',
      bank_name:       'N/A',
      account_holder:  'Demo',
      hours_json:      MADRUGADORES,
    },
    email: 'tacos@demo.local',
    menu: [
      {
        name: 'Tacos',
        sort_order: 0,
        items: [
          { name: 'Taco de carne asada',     description: 'Con cebolla, cilantro y salsa verde.',     price: 25, photo_url: 'https://picsum.photos/seed/taco-carne/400/300' },
          { name: 'Taco de pollo',           description: 'Pollo deshebrado con salsa roja.',          price: 22, photo_url: 'https://picsum.photos/seed/taco-pollo/400/300' },
          { name: 'Taco de chorizo',         description: 'Chorizo con papas y chile.',                price: 20, photo_url: 'https://picsum.photos/seed/taco-chorizo/400/300' },
          { name: 'Quesadilla de queso',     description: 'Tortilla de maíz con queso Oaxaca.',       price: 35, photo_url: 'https://picsum.photos/seed/quesadilla/400/300' },
          { name: 'Orden de sopes (3 pz)',   description: 'Con frijoles, crema y queso.',              price: 45, photo_url: 'https://picsum.photos/seed/sopes/400/300' },
        ],
      },
      {
        name: 'Bebidas',
        sort_order: 1,
        items: [
          { name: 'Agua fresca del día',     description: 'Jamaica, horchata o tamarindo.',            price: 15, photo_url: 'https://picsum.photos/seed/agua-fresca/400/300' },
          { name: 'Refresco 355ml',          description: 'Coca-Cola, Sprite o Manzanita.',            price: 20, photo_url: 'https://picsum.photos/seed/refresco/400/300' },
          { name: 'Café de olla',            description: 'Canela y piloncillo.',                      price: 18, photo_url: 'https://picsum.photos/seed/cafe-olla/400/300' },
        ],
      },
    ],
  },

  {
    biz: {
      name:            'Comedor La Familia',
      category:        'comida',
      description:     'Comidas corridas, platillos del día y antojitos caseros.',
      whatsapp_id:     '52133000002@c.us',
      address_text:    'Av. Juárez 123, Col. La Merced, Tlaquepaque',
      lat:             20.6389,
      lng:             -103.3098,
      accepts_pickup:  true,
      active:          true,
      banned:          false,
      clabe:           '000000000000000000',
      bank_name:       'N/A',
      account_holder:  'Demo',
      hours_json:      { ...TODOS_8_20, sun: { open: false, from: '09:00', to: '15:00' } },
    },
    email: 'comedor@demo.local',
    menu: [
      {
        name: 'Comida corrida',
        sort_order: 0,
        items: [
          { name: 'Comida del día completa', description: 'Sopa, guisado, frijoles, agua y tortillas.', price: 65, photo_url: 'https://picsum.photos/seed/comida-corrida/400/300' },
          { name: 'Medio servicio',          description: 'Guisado, tortillas y agua.',                 price: 45, photo_url: 'https://picsum.photos/seed/medio-servicio/400/300' },
          { name: 'Solo guisado',            description: 'El guisado del día con tortillas.',           price: 35, photo_url: 'https://picsum.photos/seed/guisado/400/300' },
        ],
      },
      {
        name: 'Antojitos',
        sort_order: 1,
        items: [
          { name: 'Enchiladas verdes (3 pz)', description: 'Con pollo, crema y queso.',   price: 45, photo_url: 'https://picsum.photos/seed/enchiladas/400/300' },
          { name: 'Tamales (2 pz)',           description: 'Rajas o picadillo.',           price: 30, photo_url: 'https://picsum.photos/seed/tamales/400/300' },
          { name: 'Pozole chico',             description: 'Rojo o blanco, con tostadas.', price: 55, photo_url: 'https://picsum.photos/seed/pozole/400/300' },
        ],
      },
    ],
  },

  {
    biz: {
      name:            'Minisuper Hernández',
      category:        'abarrotes',
      description:     'Abarrotes, refrescos, botanas y productos básicos del hogar.',
      whatsapp_id:     '52133000003@c.us',
      address_text:    'Calle Morelos 78, Col. Centro, Tlaquepaque',
      lat:             20.6411,
      lng:             -103.3124,
      accepts_pickup:  true,
      active:          true,
      banned:          false,
      clabe:           '000000000000000000',
      bank_name:       'N/A',
      account_holder:  'Demo',
      hours_json:      TODOS_8_20,
    },
    email: 'super@demo.local',
    menu: [
      {
        name: 'Bebidas',
        sort_order: 0,
        items: [
          { name: 'Coca-Cola 2L',            description: 'Refresco de cola.',                         price: 32, photo_url: 'https://picsum.photos/seed/coca-cola/400/300' },
          { name: 'Agua natural 1.5L',       description: 'Ciel o similar.',                           price: 18, photo_url: 'https://picsum.photos/seed/agua-natural/400/300' },
          { name: 'Jugo Del Valle 1L',       description: 'Varios sabores.',                           price: 28, photo_url: 'https://picsum.photos/seed/jugo/400/300' },
          { name: 'Leche Lala 1L',           description: 'Entera o light.',                           price: 25, photo_url: 'https://picsum.photos/seed/leche/400/300' },
        ],
      },
      {
        name: 'Botanas y básicos',
        sort_order: 1,
        items: [
          { name: 'Doritos 62g',             description: 'Nacho o Flamin Hot.',                       price: 18, photo_url: 'https://picsum.photos/seed/doritos/400/300' },
          { name: 'Papas Sabritas 45g',      description: 'Sal, Queso o Habanero.',                    price: 16, photo_url: 'https://picsum.photos/seed/papas-sabritas/400/300' },
          { name: 'Frijoles negros 1kg',     description: 'Bolsa El Sarampión.',                      price: 35, photo_url: 'https://picsum.photos/seed/frijoles/400/300' },
          { name: 'Arroz 1kg',               description: 'Arroz blanco de grano largo.',              price: 28, photo_url: 'https://picsum.photos/seed/arroz/400/300' },
          { name: 'Aceite 1L',               description: 'Maíz o girasol.',                           price: 42, photo_url: 'https://picsum.photos/seed/aceite/400/300' },
        ],
      },
    ],
  },

  {
    biz: {
      name:            'Carnicería La Mejor',
      category:        'carniceria',
      description:     'Carne fresca de res, cerdo y pollo. Piezas y molida al momento.',
      whatsapp_id:     '52133000004@c.us',
      address_text:    'Mercado Municipal, Local 12, Tlaquepaque',
      lat:             20.6405,
      lng:             -103.3141,
      accepts_pickup:  true,
      active:          true,
      banned:          false,
      clabe:           '000000000000000000',
      bank_name:       'N/A',
      account_holder:  'Demo',
      hours_json:      MADRUGADORES,
    },
    email: 'carniceria@demo.local',
    menu: [
      {
        name: 'Res',
        sort_order: 0,
        items: [
          { name: 'Carne molida (kg)',        description: 'Res 90/10, ideal para guisados.',           price: 145, photo_url: 'https://picsum.photos/seed/carne-molida/400/300' },
          { name: 'Milanesa de res (kg)',     description: 'Finamente rebanada y aplanada.',            price: 165, photo_url: 'https://picsum.photos/seed/milanesa/400/300' },
          { name: 'Costilla de res (kg)',     description: 'Para asar o en caldo.',                     price: 120, photo_url: 'https://picsum.photos/seed/costilla/400/300' },
          { name: 'Bistec (kg)',              description: 'Corte delgado para freír.',                  price: 150, photo_url: 'https://picsum.photos/seed/bistec/400/300' },
        ],
      },
      {
        name: 'Cerdo y pollo',
        sort_order: 1,
        items: [
          { name: 'Pollo entero (kg)',        description: 'Fresco de granja.',                         price: 85,  photo_url: 'https://picsum.photos/seed/pollo-entero/400/300' },
          { name: 'Pechuga de pollo (kg)',    description: 'Sin hueso, sin piel.',                      price: 115, photo_url: 'https://picsum.photos/seed/pechuga/400/300' },
          { name: 'Pierna de cerdo (kg)',     description: 'Ideal para carnitas.',                      price: 110, photo_url: 'https://picsum.photos/seed/pierna-cerdo/400/300' },
          { name: 'Chuletas de cerdo (kg)',   description: 'Con o sin hueso.',                          price: 130, photo_url: 'https://picsum.photos/seed/chuletas/400/300' },
        ],
      },
    ],
  },

  {
    biz: {
      name:            'Panadería San José',
      category:        'panaderia',
      description:     'Pan dulce, pasteles y repostería. Horneado fresco cada mañana.',
      whatsapp_id:     '52133000005@c.us',
      address_text:    'Calle Reforma 22, Col. Santa Cruz, Tlaquepaque',
      lat:             20.6378,
      lng:             -103.3089,
      accepts_pickup:  true,
      active:          true,
      banned:          false,
      clabe:           '000000000000000000',
      bank_name:       'N/A',
      account_holder:  'Demo',
      hours_json:      { ...MADRUGADORES, mon: { open: true, from: '06:30', to: '20:00' }, fri: { open: true, from: '06:30', to: '20:00' } },
    },
    email: 'panaderia@demo.local',
    menu: [
      {
        name: 'Pan dulce',
        sort_order: 0,
        items: [
          { name: 'Concha',                  description: 'Vainilla o chocolate.',                     price: 8,  photo_url: 'https://picsum.photos/seed/concha-pan/400/300' },
          { name: 'Cuerno',                  description: 'Hojaldrado con azúcar.',                    price: 9,  photo_url: 'https://picsum.photos/seed/cuerno-pan/400/300' },
          { name: 'Polvorón',                description: 'Mantecado de naranja.',                     price: 7,  photo_url: 'https://picsum.photos/seed/polvoron/400/300' },
          { name: 'Oreja',                   description: 'Hojaldrada con azúcar.',                    price: 8,  photo_url: 'https://picsum.photos/seed/oreja-pan/400/300' },
          { name: 'Donut glaseado',          description: 'Con betún de azúcar glass.',                price: 10, photo_url: 'https://picsum.photos/seed/donut/400/300' },
        ],
      },
      {
        name: 'Pasteles y repostería',
        sort_order: 1,
        items: [
          { name: 'Pastel básico chico',     description: 'Vainilla o chocolate, para 8 personas.',    price: 180, photo_url: 'https://picsum.photos/seed/pastel/400/300' },
          { name: 'Pay de queso',            description: 'Con coulis de fresa.',                      price: 120, photo_url: 'https://picsum.photos/seed/pay-queso/400/300' },
          { name: 'Muffins (6 pz)',          description: 'Blueberry o chispas de chocolate.',         price: 55,  photo_url: 'https://picsum.photos/seed/muffins/400/300' },
          { name: 'Caja de galletas (12 pz)', description: 'Surtidas de mantequilla.',                  price: 45,  photo_url: 'https://picsum.photos/seed/galletas/400/300' },
        ],
      },
    ],
  },

  {
    biz: {
      name:            'Farmacia Colonia',
      category:        'farmacia',
      description:     'Medicamentos, vitaminas y artículos de higiene personal.',
      whatsapp_id:     '52133000006@c.us',
      address_text:    'Av. 8 de Julio 456, Col. Centro, Tlaquepaque',
      lat:             20.6432,
      lng:             -103.3107,
      accepts_pickup:  true,
      active:          true,
      banned:          false,
      clabe:           '000000000000000000',
      bank_name:       'N/A',
      account_holder:  'Demo',
      hours_json:      FARMACIA_HORARIO,
    },
    email: 'farmacia@demo.local',
    menu: [
      {
        name: 'Medicamentos básicos',
        sort_order: 0,
        items: [
          { name: 'Paracetamol 500mg (10 tab)', description: 'Analgésico y antipirético genérico.',    price: 25, photo_url: 'https://picsum.photos/seed/paracetamol/400/300' },
          { name: 'Ibuprofeno 400mg (10 tab)',  description: 'Antiinflamatorio genérico.',              price: 28, photo_url: 'https://picsum.photos/seed/ibuprofeno/400/300' },
          { name: 'Antiácido Sal de Uvas (8)',  description: 'Alivio para la acidez estomacal.',       price: 35, photo_url: 'https://picsum.photos/seed/antiacido/400/300' },
          { name: 'Omeprazol 20mg (7 cáps)',    description: 'Protector gástrico genérico.',           price: 45, photo_url: 'https://picsum.photos/seed/omeprazol/400/300' },
        ],
      },
      {
        name: 'Vitaminas e higiene',
        sort_order: 1,
        items: [
          { name: 'Vitamina C 1g (10 efervesc.)', description: 'Refuerzo inmunológico.',               price: 45, photo_url: 'https://picsum.photos/seed/vitamina-c/400/300' },
          { name: 'Alcohol 96° 500ml',            description: 'Para desinfección.',                   price: 38, photo_url: 'https://picsum.photos/seed/alcohol/400/300' },
          { name: 'Cubrebocas KN95 (5 pz)',       description: 'Mascarilla de protección.',            price: 42, photo_url: 'https://picsum.photos/seed/cubrebocas/400/300' },
          { name: 'Termómetro digital',           description: 'Medición rápida en 30 segundos.',      price: 95, photo_url: 'https://picsum.photos/seed/termometro/400/300' },
        ],
      },
    ],
  },

  {
    biz: {
      name:            'Miscelánea Lupita',
      category:        'miscelanea',
      description:     'Papelería, artículos del hogar y productos variados para la colonia.',
      whatsapp_id:     '52133000007@c.us',
      address_text:    'Calle Hidalgo 89, Col. Santa Cruz, Tlaquepaque',
      lat:             20.6368,
      lng:             -103.3102,
      accepts_pickup:  true,
      active:          true,
      banned:          false,
      clabe:           '000000000000000000',
      bank_name:       'N/A',
      account_holder:  'Demo',
      hours_json:      LUNES_SAB_9_21,
    },
    email: 'miscelanea@demo.local',
    menu: [
      {
        name: 'Papelería',
        sort_order: 0,
        items: [
          { name: 'Libreta cuadrícula',      description: 'Rayada, 100 hojas.',                       price: 18, photo_url: 'https://picsum.photos/seed/libreta/400/300' },
          { name: 'Bolígrafos (3 pz)',       description: 'Azul, negro y rojo.',                      price: 15, photo_url: 'https://picsum.photos/seed/boligrafos/400/300' },
          { name: 'Cinta adhesiva',          description: 'Scotch 18mm x 30m.',                       price: 12, photo_url: 'https://picsum.photos/seed/cinta-adhesiva/400/300' },
          { name: 'Tijeras',                 description: 'Punta redonda, uso general.',               price: 22, photo_url: 'https://picsum.photos/seed/tijeras/400/300' },
        ],
      },
      {
        name: 'Artículos del hogar',
        sort_order: 1,
        items: [
          { name: 'Foco LED 9W',             description: 'Luz blanca, base E27.',                    price: 35, photo_url: 'https://picsum.photos/seed/foco-led/400/300' },
          { name: 'Pilas AA (2 pz)',          description: 'Duracell o Energizer.',                    price: 22, photo_url: 'https://picsum.photos/seed/pilas-aa/400/300' },
          { name: 'Desengrasante multiusos',  description: 'Spray 500ml, aroma limón.',               price: 28, photo_url: 'https://picsum.photos/seed/desengrasante/400/300' },
          { name: 'Bolsas de basura (10 pz)', description: 'Negras, capacidad 60L.',                   price: 20, photo_url: 'https://picsum.photos/seed/bolsas-basura/400/300' },
        ],
      },
    ],
  },
];

// ─── Seed principal ─────────────────────────────────────────────────────────

exports.seed = async function (knex) {
  const passwordHash = await bcrypt.hash('demo1234', 10);
  let created = 0;
  let skipped = 0;

  for (const { biz, email, menu } of DEMO_BUSINESSES) {
    const existing = await knex('businesses').where({ whatsapp_id: biz.whatsapp_id }).first();
    if (existing) {
      skipped++;
      continue;
    }

    // Insertar negocio
    const [business] = await knex('businesses')
      .insert({ ...biz, hours_json: JSON.stringify(biz.hours_json) })
      .returning('*');

    // Insertar usuario del panel de negocio
    const existingUser = await knex('business_users').where({ email }).first();
    if (!existingUser) {
      await knex('business_users').insert({
        business_id:   business.id,
        email,
        password_hash: passwordHash,
      });
    }

    // Insertar categorías e ítems del menú
    for (const cat of menu) {
      const [category] = await knex('menu_categories')
        .insert({ business_id: business.id, name: cat.name, sort_order: cat.sort_order, active: true })
        .returning('*');

      for (const item of cat.items) {
        await knex('menu_items').insert({
          category_id: category.id,
          name:        item.name,
          description: item.description,
          price:       item.price,
          photo_url:   item.photo_url || null,
          available:   true,
        });
      }
    }

    created++;
  }

  if (created > 0) console.log(`✅ ${created} negocios demo creados (contraseña panel: demo1234)`);
  if (skipped > 0) console.log(`ℹ️  ${skipped} negocios demo ya existían, se saltaron`);
};
