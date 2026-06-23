'use strict';

// Registry of SVG icons for businesses.
// Each entry: { key, label, color, defaultFor[], svg }
// svg is an inline <svg> string with fill="currentColor".
// defaultFor lists category values that use this icon by default.

const ICONS = [
  {
    key: 'comida',
    label: 'Comida',
    color: '#e67e22',
    defaultFor: ['comida'],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>',
  },
  {
    key: 'abarrotes',
    label: 'Abarrotes',
    color: '#27ae60',
    defaultFor: ['abarrotes'],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.21 9l-4.38-6.56c-.19-.28-.51-.42-.83-.42-.32 0-.64.14-.83.43L6.79 9H2c-.55 0-1 .45-1 1l.04.27 2.54 9.27c.23.84 1 1.46 1.92 1.46h13c.92 0 1.69-.62 1.93-1.46l2.54-9.27L23 10c0-.55-.45-1-1-1h-4.79zM9 9l3-4.4L15 9H9zm3 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>',
  },
  {
    key: 'carniceria',
    label: 'Carnicería',
    color: '#c0392b',
    defaultFor: ['carniceria'],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8.17-15.03-8.17-15.03 0h15.03zM1 17h15.03v2H1V17z"/></svg>',
  },
  {
    key: 'panaderia',
    label: 'Panadería',
    color: '#d4830a',
    defaultFor: ['panaderia'],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-2.81c.45-.78.81-1.65.81-2.5C18 3.01 15.99 1 13.5 1c-1.23 0-2.34.49-3.19 1.28C9.55 1.49 8.44 1 7.25 1 4.59 1 2.43 3.16 2.43 5.83c0 .89.29 1.73.77 2.47C1.24 9.13 0 10.96 0 13c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5 0-2.04-1.24-3.87-4-5z"/></svg>',
  },
  {
    key: 'farmacia',
    label: 'Farmacia',
    color: '#2980b9',
    defaultFor: ['farmacia'],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>',
  },
  {
    key: 'miscelanea',
    label: 'Miscelánea',
    color: '#8e44ad',
    defaultFor: ['miscelanea'],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>',
  },
  {
    key: 'cafe',
    label: 'Café',
    color: '#6d4c41',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>',
  },
  {
    key: 'pizza',
    label: 'Pizza',
    color: '#e74c3c',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.43 2 5.23 3.54 3.01 6L12 22l8.99-16C18.77 3.54 15.57 2 12 2zM7 7c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>',
  },
  {
    key: 'hamburguesa',
    label: 'Hamburguesa',
    color: '#f39c12',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c-2.77 0-5.5 2.23-5.5 5H4v1c0 1.66 1.34 3 3 3h10c1.66 0 3-1.34 3-3v-1h-.5c-1.1 0-2-.9-2-2s.9-2 2-2h.5v-1H18.5zM3 13c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM11.5 2C6.26 2 2 6.26 2 11.5h19C21 6.26 16.74 2 11.5 2z"/></svg>',
  },
  {
    key: 'helados',
    label: 'Helados',
    color: '#e91e8c',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C8.13 3 5 6.13 5 10c0 2.61 1.4 4.88 3.5 6.14V17c0 .55.45 1 1 1h5c.55 0 1-.45 1-1v-.86C17.6 14.88 19 12.61 19 10c0-3.87-3.13-7-7-7zm1 13h-2v-1h2v1zm0-3h-2V9h2v4z"/></svg>',
  },
  {
    key: 'mariscos',
    label: 'Mariscos',
    color: '#1565c0',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 12.5c0-.28-.22-.5-.5-.5h-1.55C17.45 10.38 16.34 9 15 9c-1.1 0-2 .9-2 2H11c0-1.1-.9-2-2-2-1.34 0-2.45 1.38-2.95 3H4.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5h1.55C6.55 13.62 7.66 15 9 15c1.1 0 2-.9 2-2h2c0 1.1.9 2 2 2 1.34 0 2.45-1.38 2.95-3h1.55c.28 0 .5-.22.5-.5v-1zM9 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/><path d="M12 3L9 7h6l-3-4zm0 18l3-4H9l3 4z"/></svg>',
  },
  {
    key: 'pollo',
    label: 'Pollo',
    color: '#ff8f00',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 11H3L2 14H1v2h10v-2H9c-1.66 0-3-1.34-3-3V8.89c.64-.34 1.16-.91 1.41-1.61l1.4-3.96C9.15 2.51 9.83 2 10.6 2c.99 0 1.6.75 1.6 1.6 0 .2-.03.4-.09.59L10.87 8H13c2.03 0 4.07.68 5.5 2.11V5h-1v3c-.5-.34-1-.61-1.5-.8V3c0-1.1-.9-2-2-2h-3C9 1 7.64 1.78 7 3H5C3.9 3 3 3.9 3 5v5.5c0 .28.22.5.5.5H4.5zm7.5 1v2h6v-2h-6zm6.5 3H12v2h7.59l-.5-1-.59-1zm-5.5 3H7v2h12v-2h-5.5z"/></svg>',
  },
  {
    key: 'sushi',
    label: 'Sushi',
    color: '#00897b',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>',
  },
  {
    key: 'frutas',
    label: 'Frutas y verduras',
    color: '#43a047',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8.17-15.03-8.17-15.03 0h15.03zM1 17h15.03v2H1V17z"/></svg>',
  },
  {
    key: 'bebidas',
    label: 'Bebidas',
    color: '#039be5',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3l-.75 4.5C4.46 8.91 5.07 10.5 6.08 11.5L5.5 21h13l-.58-9.5c1.01-1 1.62-2.59 1.83-4L19 3H6zm7.88 10.78l-.88 5.22h-2l-.88-5.22c-.78-.24-1.5-.66-2.12-1.25l2-1.53c.28.22.61.37.97.44l.04-2.22h2l.04 2.22c.35-.07.68-.23.97-.44l2 1.53c-.63.59-1.35 1.01-2.14 1.25z"/></svg>',
  },
  {
    key: 'desayunos',
    label: 'Desayunos',
    color: '#fb8c00',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>',
  },
  {
    key: 'dulces',
    label: 'Dulcería',
    color: '#d81b60',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 6c1.11 0 2-.89 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.11.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 17.74 5.88 18 5 18c-.88 0-1.73-.28-2.43-.42V22h18v-4.42c-.7.14-1.55.42-2.43.42-.88 0-1.75-.26-2.54-1.01zM18 9h-5V7h-2v2H6C4.34 9 3 10.34 3 12v2.5c0 .83.67 1.5 1.5 1.5.83 0 1.5-.67 1.5-1.5V12h14v2.5c0 .83.67 1.5 1.5 1.5.83 0 1.5-.67 1.5-1.5V12c0-1.66-1.34-3-3-3z"/></svg>',
  },
  {
    key: 'papeleria',
    label: 'Papelería',
    color: '#5c6bc0',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  },
  {
    key: 'ferreteria',
    label: 'Ferretería',
    color: '#546e7a',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.78 15.3L19.78 21.3L21.89 19.14L15.89 13.14L13.78 15.3ZM17.5 10.1C19.92 10.1 21.9 8.12 21.9 5.7C21.9 5.16 21.8 4.65 21.62 4.17L18.86 6.93L16.97 5.04L19.73 2.28C19.25 2.1 18.74 2 18.2 2C15.78 2 13.8 3.98 13.8 6.4C13.8 6.8 13.86 7.2 13.96 7.57L11.59 9.94C11.22 9.84 10.82 9.78 10.4 9.78C7.98 9.78 6 11.76 6 14.18C6 16.6 7.98 18.58 10.4 18.58C12.82 18.58 14.8 16.6 14.8 14.18C14.8 13.76 14.74 13.36 14.64 12.99L17 10.62C17.14 10.64 17.32 10.1 17.5 10.1ZM10.4 16.78C9.06 16.78 7.98 15.7 7.98 14.36S9.06 11.94 10.4 11.94S12.82 13.02 12.82 14.36S11.74 16.78 10.4 16.78Z"/></svg>',
  },
  {
    key: 'veterinaria',
    label: 'Veterinaria',
    color: '#26a69a',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 11.5A2.5 2.5 0 002 14a2.5 2.5 0 002.5 2.5A2.5 2.5 0 007 14a2.5 2.5 0 00-2.5-2.5zm15 0A2.5 2.5 0 0017 14a2.5 2.5 0 002.5 2.5A2.5 2.5 0 0022 14a2.5 2.5 0 00-2.5-2.5zm-7.5-9A2.5 2.5 0 009.5 5a2.5 2.5 0 002.5 2.5A2.5 2.5 0 0014.5 5 2.5 2.5 0 0012 2.5zm5 2A2.5 2.5 0 0014.5 7 2.5 2.5 0 0017 9.5 2.5 2.5 0 0019.5 7 2.5 2.5 0 0017 4.5zm-10 0A2.5 2.5 0 004.5 7 2.5 2.5 0 007 9.5 2.5 2.5 0 009.5 7 2.5 2.5 0 007 4.5zM12 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  },
  {
    key: 'barberia',
    label: 'Barbería / Salón',
    color: '#7b1fa2',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z"/></svg>',
  },
  {
    key: 'lavanderia',
    label: 'Lavandería',
    color: '#0288d1',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.17 16.83a4 4 0 005.66 0 4 4 0 000-5.66l-5.66 5.66zM18 2.01L6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM10 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM7 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>',
  },
  {
    key: 'electronica',
    label: 'Electrónica',
    color: '#00acc1',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
  },
  {
    key: 'ropa',
    label: 'Ropa y Moda',
    color: '#ec407a',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6.5l-4-4-5 5-5-5-4 4 3 3v10c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V9.5l3-3z"/></svg>',
  },
  {
    key: 'servicios',
    label: 'Servicios',
    color: '#455a64',
    defaultFor: [],
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
  },
];

function getRegistry() {
  return ICONS;
}

function getIcon(key, category) {
  if (key) {
    const found = ICONS.find((i) => i.key === key);
    if (found) return found;
  }
  if (category) {
    const def = ICONS.find((i) => i.defaultFor && i.defaultFor.includes(category));
    if (def) return def;
  }
  return ICONS[0];
}

module.exports = { getRegistry, getIcon };
