import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Login from './pages/Login.jsx';
import ActiveOrders from './pages/ActiveOrders.jsx';
import Menu from './pages/Menu.jsx';
import Hours from './pages/Hours.jsx';
import History from './pages/History.jsx';
import Analytics from './pages/Analytics.jsx';

function isAuth() { return !!localStorage.getItem('biz_token'); }

function Layout({ children }) {
  const navClass = ({ isActive }) =>
    `block px-4 py-2 rounded hover:bg-orange-700 ${isActive ? 'bg-orange-700 font-semibold' : ''}`;
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-56 bg-orange-600 text-white flex flex-col p-4 gap-1">
        <div className="text-xl font-bold mb-6">🏪 Mi Negocio</div>
        <NavLink to="/orders" className={navClass}>📦 Pedidos activos</NavLink>
        <NavLink to="/menu" className={navClass}>📋 Menú</NavLink>
        <NavLink to="/hours" className={navClass}>🕐 Horarios</NavLink>
        <NavLink to="/history" className={navClass}>📜 Historial</NavLink>
        <NavLink to="/analytics" className={navClass}>📈 Analíticas</NavLink>
        <button className="mt-auto text-left px-4 py-2 rounded hover:bg-orange-700"
          onClick={() => { localStorage.removeItem('biz_token'); window.location.href = '/login'; }}>
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
      <Route path="/orders" element={<Protected><ActiveOrders /></Protected>} />
      <Route path="/menu" element={<Protected><Menu /></Protected>} />
      <Route path="/hours" element={<Protected><Hours /></Protected>} />
      <Route path="/history" element={<Protected><History /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="*" element={<Navigate to={isAuth() ? '/orders' : '/login'} />} />
    </Routes>
  );
}
