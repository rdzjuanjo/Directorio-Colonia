// Login.jsx — Pantalla de inicio de sesión del panel admin con diseño de dos paneles (verde + formulario)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.login(email, password);
      if (res.token) {
        localStorage.setItem('admin_token', res.token);
        navigate('/dashboard');
      } else {
        setError('Credenciales inválidas');
      }
    } catch {
      setError('Credenciales inválidas');
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F1EEE8' }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-80 flex-col justify-between p-10" style={{ background: '#1A2B1A' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
            style={{ background: '#D97706', color: '#1A2B1A' }}>
            TE
          </div>
          <div>
            <div className="text-xs font-semibold tracking-widest" style={{ color: '#C8DFC8', letterSpacing: '0.15em' }}>
              TIENDA ESQUINA
            </div>
            <div className="text-[10px]" style={{ color: '#6B8F6B', letterSpacing: '0.1em' }}>ADMIN</div>
          </div>
        </div>
        <div>
          <p className="text-sm leading-relaxed" style={{ color: '#6B8F6B' }}>
            Panel de administración para gestionar negocios, pedidos y repartidores de la plataforma.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
              style={{ background: '#1A2B1A', color: '#D97706' }}>
              TE
            </div>
            <span className="font-semibold text-sm tracking-wide" style={{ color: '#1A2B1A' }}>Tienda Esquina Admin</span>
          </div>

          <div className="mb-7">
            <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#78716C' }}>Acceso</p>
            <h1 className="text-2xl font-semibold" style={{ color: '#1A2B1A' }}>Iniciar sesión</h1>
            <div className="mt-2 h-px" style={{ background: '#E3DDD4' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                {error}
              </p>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: '#78716C' }}>Email</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-shadow"
                style={{ background: '#FDFBF8', border: '1px solid #E3DDD4', color: '#1C1917' }}
                onFocus={e => e.target.style.borderColor = '#1A2B1A'}
                onBlur={e => e.target.style.borderColor = '#E3DDD4'}
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: '#78716C' }}>Contraseña</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-shadow"
                style={{ background: '#FDFBF8', border: '1px solid #E3DDD4', color: '#1C1917' }}
                onFocus={e => e.target.style.borderColor = '#1A2B1A'}
                onBlur={e => e.target.style.borderColor = '#E3DDD4'}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 mt-2"
              style={{ background: '#1A2B1A', color: '#fff' }}
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
