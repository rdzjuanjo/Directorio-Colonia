// App.jsx — Enrutador del panel de negocio: Layout con sidebar espresso oscuro, rutas protegidas por JWT en localStorage
import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Login from './pages/Login.jsx';
import ActiveOrders from './pages/ActiveOrders.jsx';
import Menu from './pages/Menu.jsx';
import Hours from './pages/Hours.jsx';
import History from './pages/History.jsx';
import Analytics from './pages/Analytics.jsx';

function isAuth() { return !!localStorage.getItem('biz_token'); }

const NAV_ITEMS = [
  { to: '/orders',    icon: '▣', label: 'Pedidos activos' },
  { to: '/menu',      icon: '◈', label: 'Menú' },
  { to: '/hours',     icon: '◎', label: 'Horarios' },
  { to: '/history',   icon: '◇', label: 'Historial' },
  { to: '/analytics', icon: '⊡', label: 'Analíticas' },
];

function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#F1EEE8' }}>
      <aside className="w-52 flex flex-col flex-shrink-0" style={{ background: '#2B1A10', color: '#F0E4DB' }}>
        {/* Wordmark */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: '#EA580C', color: '#fff' }}>
              TE
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest" style={{ color: '#F0E4DB', letterSpacing: '0.12em' }}>
                Mi Negocio
              </div>
              <div className="text-[10px]" style={{ color: '#9C6E5C', letterSpacing: '0.1em' }}>
                TIENDA ESQUINA
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
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'font-semibold' : 'font-normal'}`
              }
              style={({ isActive }) => isActive
                ? { background: 'rgba(255,255,255,0.1)', color: '#fff', borderLeft: '3px solid #EA580C', paddingLeft: '9px' }
                : { color: '#C4917E' }
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
            style={{ color: '#9C6E5C' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9C6E5C'; e.currentTarget.style.background = 'transparent'; }}
            onClick={() => { localStorage.removeItem('biz_token'); window.location.href = '/login'; }}
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
      <Route path="/orders" element={<Protected><ActiveOrders /></Protected>} />
      <Route path="/menu" element={<Protected><Menu /></Protected>} />
      <Route path="/hours" element={<Protected><Hours /></Protected>} />
      <Route path="/history" element={<Protected><History /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="*" element={<Navigate to={isAuth() ? '/orders' : '/login'} />} />
    </Routes>
  );
}
