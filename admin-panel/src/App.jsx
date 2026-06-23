// App.jsx — Enrutador del panel admin: Layout con sidebar verde oscuro, rutas protegidas por JWT en localStorage
import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import Businesses from './pages/Businesses.jsx';
import Riders from './pages/Riders.jsx';
import Disputes from './pages/Disputes.jsx';
import Analytics from './pages/Analytics.jsx';
import Zone from './pages/Zone.jsx';
import CatalogStats from './pages/CatalogStats.jsx';
import Customers from './pages/Customers.jsx';

function isAuth() {
  return !!localStorage.getItem('admin_token');
}

const NAV_ITEMS = [
  { to: '/dashboard',     icon: '◈', label: 'Dashboard' },
  { to: '/orders',        icon: '▣', label: 'Pedidos' },
  { to: '/businesses',    icon: '⬡', label: 'Negocios' },
  { to: '/riders',        icon: '◎', label: 'Repartidores' },
  { to: '/disputes',      icon: '△', label: 'Disputas' },
  { to: '/analytics',     icon: '⊡', label: 'Analíticas' },
  { to: '/zone',          icon: '◯', label: 'Zona de entrega' },
  { to: '/catalog-stats', icon: '◇', label: 'Bot catálogo' },
  { to: '/customers',     icon: '⊕', label: 'Usuarios' },
];

function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#F1EEE8' }}>
      <aside className="w-52 flex flex-col flex-shrink-0" style={{ background: '#1A2B1A', color: '#C8DFC8' }}>
        {/* Wordmark */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: '#D97706', color: '#1A2B1A' }}>
              TE
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#C8DFC8', letterSpacing: '0.15em' }}>
                Tienda Esquina
              </div>
              <div className="text-[10px] font-medium" style={{ color: '#6B8F6B', letterSpacing: '0.1em' }}>
                ADMIN
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'font-semibold'
                    : 'font-normal'
                }`
              }
              style={({ isActive }) => isActive
                ? { background: 'rgba(255,255,255,0.1)', color: '#fff', borderLeft: '3px solid #D97706', paddingLeft: '9px' }
                : { color: '#9AB89A' }
              }
            >
              <span className="text-base leading-none flex-shrink-0" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '4px' }}>
          <button
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full text-left transition-colors"
            style={{ color: '#6B8F6B' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#6B8F6B'; e.currentTarget.style.background = 'transparent'; }}
            onClick={() => { localStorage.removeItem('admin_token'); window.location.href = '/login'; }}
          >
            <span className="text-base leading-none">↩</span>
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-7">
        {children}
      </main>
    </div>
  );
}

function Protected({ children }) {
  return isAuth() ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/businesses" element={<Protected><Businesses /></Protected>} />
      <Route path="/riders" element={<Protected><Riders /></Protected>} />
      <Route path="/disputes" element={<Protected><Disputes /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/zone" element={<Protected><Zone /></Protected>} />
      <Route path="/catalog-stats" element={<Protected><CatalogStats /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="*" element={<Navigate to={isAuth() ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}
