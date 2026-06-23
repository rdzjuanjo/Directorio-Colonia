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

function isAuth() {
  return !!localStorage.getItem('admin_token');
}

function Layout({ children }) {
  const navClass = ({ isActive }) =>
    `block px-4 py-2 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-700 font-semibold' : ''}`;
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col p-4 gap-1">
        <div className="text-xl font-bold mb-6">🏘️ Colonia Admin</div>
        <NavLink to="/dashboard" className={navClass}>📊 Dashboard</NavLink>
        <NavLink to="/orders" className={navClass}>📦 Pedidos</NavLink>
        <NavLink to="/businesses" className={navClass}>🏪 Negocios</NavLink>
        <NavLink to="/riders" className={navClass}>🛵 Repartidores</NavLink>
        <NavLink to="/disputes" className={navClass}>⚠️ Disputas</NavLink>
        <NavLink to="/analytics" className={navClass}>📈 Analíticas</NavLink>
        <NavLink to="/zone" className={navClass}>🗺️ Zona de entrega</NavLink>
        <NavLink to="/catalog-stats" className={navClass}>🤖 Bot catálogo</NavLink>
        <button
          className="mt-auto text-left px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => { localStorage.removeItem('admin_token'); window.location.href = '/login'; }}>
          🚪 Salir
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
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
      <Route path="*" element={<Navigate to={isAuth() ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}
