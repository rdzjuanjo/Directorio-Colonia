// Login.jsx — Pantalla de inicio de sesión del panel de negocio con flujo completo de recuperación de contraseña por WhatsApp
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Login() {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.login(email, password);
      if (res.token) {
        localStorage.setItem('biz_token', res.token);
        navigate('/orders');
      } else {
        setError('Credenciales inválidas');
      }
    } catch {
      setError('Credenciales inválidas');
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await api.forgotPassword(email);
    setLoading(false);
    setInfo('Si el correo está registrado, recibirás un código por WhatsApp en los próximos minutos.');
    setView('reset');
  }

  async function handleReset(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden');
    setLoading(true);
    const res = await api.resetPassword(code, newPassword);
    setLoading(false);
    if (res.ok) {
      setInfo('');
      setView('login');
      setPassword('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('Contraseña actualizada. Inicia sesión.');
    } else {
      setError(res.error || 'Código inválido o expirado');
    }
  }

  function goBack() { setError(''); setInfo(''); setView('login'); }

  const inputStyle = {
    background: '#FDFBF8',
    border: '1px solid #E3DDD4',
    color: '#1C1917',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  };

  const btnStyle = {
    background: '#2B1A10',
    color: '#fff',
    width: '100%',
    padding: '10px 0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
  };

  const accentBtnStyle = {
    ...btnStyle,
    background: '#EA580C',
  };

  function Shell({ title, subtitle, onSubmit, children }) {
    return (
      <div className="min-h-screen flex" style={{ background: '#F1EEE8' }}>
        <div className="hidden lg:flex w-72 flex-col justify-between p-10" style={{ background: '#2B1A10' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
              style={{ background: '#EA580C', color: '#fff' }}>
              TE
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest" style={{ color: '#F0E4DB', letterSpacing: '0.12em' }}>MI NEGOCIO</div>
              <div className="text-[10px]" style={{ color: '#9C6E5C', letterSpacing: '0.1em' }}>TIENDA ESQUINA</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#9C6E5C' }}>
            Gestiona tus pedidos, actualiza tu menú y revisa tus analíticas desde aquí.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                style={{ background: '#2B1A10', color: '#EA580C' }}>
                TE
              </div>
              <span className="font-semibold text-sm" style={{ color: '#1C1917' }}>Mi Negocio</span>
            </div>

            <div className="mb-7">
              <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#78716C' }}>{subtitle}</p>
              <h1 className="text-2xl font-semibold" style={{ color: '#1C1917' }}>{title}</h1>
              <div className="mt-2 h-px" style={{ background: '#E3DDD4' }} />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {children}
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'forgot') {
    return (
      <Shell title="Recuperar acceso" subtitle="Contraseña" onSubmit={handleForgot}>
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#FEE2E2', color: '#B91C1C' }}>{error}</p>}
        <p className="text-sm" style={{ color: '#78716C' }}>Ingresa tu correo y te enviaremos un código por WhatsApp.</p>
        <input style={inputStyle} type="email" placeholder="tu@correo.com" value={email}
          onFocus={e => e.target.style.borderColor = '#EA580C'}
          onBlur={e => e.target.style.borderColor = '#E3DDD4'}
          onChange={(e) => setEmail(e.target.value)} required />
        <button style={accentBtnStyle} disabled={loading}>{loading ? 'Enviando...' : 'Enviar código'}</button>
        <button type="button" className="w-full text-sm text-center hover:underline" style={{ color: '#78716C', background: 'none', border: 'none', cursor: 'pointer' }} onClick={goBack}>Volver al inicio de sesión</button>
      </Shell>
    );
  }

  if (view === 'reset') {
    return (
      <Shell title="Nueva contraseña" subtitle="Restablecer" onSubmit={handleReset}>
        {info && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#D1FAE5', color: '#065F46' }}>{info}</p>}
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#FEE2E2', color: '#B91C1C' }}>{error}</p>}
        <input style={inputStyle} type="text" placeholder="Código de 6 dígitos" value={code}
          onFocus={e => e.target.style.borderColor = '#EA580C'}
          onBlur={e => e.target.style.borderColor = '#E3DDD4'}
          onChange={(e) => setCode(e.target.value)} maxLength={6} required />
        <input style={inputStyle} type="password" placeholder="Nueva contraseña" value={newPassword}
          onFocus={e => e.target.style.borderColor = '#EA580C'}
          onBlur={e => e.target.style.borderColor = '#E3DDD4'}
          onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
        <input style={inputStyle} type="password" placeholder="Confirmar contraseña" value={confirmPassword}
          onFocus={e => e.target.style.borderColor = '#EA580C'}
          onBlur={e => e.target.style.borderColor = '#E3DDD4'}
          onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
        <button style={accentBtnStyle} disabled={loading}>{loading ? 'Guardando...' : 'Cambiar contraseña'}</button>
        <button type="button" className="w-full text-sm text-center hover:underline" style={{ color: '#78716C', background: 'none', border: 'none', cursor: 'pointer' }} onClick={goBack}>Volver al inicio de sesión</button>
      </Shell>
    );
  }

  return (
    <Shell title="Iniciar sesión" subtitle="Acceso" onSubmit={handleLogin}>
      {error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ background: error.includes('actualizada') ? '#D1FAE5' : '#FEE2E2', color: error.includes('actualizada') ? '#065F46' : '#B91C1C' }}>
          {error}
        </p>
      )}
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: '#78716C', display: 'block' }}>Email</label>
        <input style={inputStyle} type="email" placeholder="tu@negocio.com" value={email}
          onFocus={e => e.target.style.borderColor = '#EA580C'}
          onBlur={e => e.target.style.borderColor = '#E3DDD4'}
          onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: '#78716C', display: 'block' }}>Contraseña</label>
        <input style={inputStyle} type="password" placeholder="••••••••" value={password}
          onFocus={e => e.target.style.borderColor = '#EA580C'}
          onBlur={e => e.target.style.borderColor = '#E3DDD4'}
          onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button style={accentBtnStyle}>Ingresar</button>
      <button type="button" className="w-full text-sm text-center hover:underline"
        style={{ color: '#EA580C', background: 'none', border: 'none', cursor: 'pointer' }}
        onClick={() => { setError(''); setView('forgot'); }}>
        ¿Olvidaste tu contraseña?
      </button>
    </Shell>
  );
}
