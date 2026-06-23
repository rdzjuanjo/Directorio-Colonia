import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Login() {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
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
    const res = await api.login(email, password);
    if (res.token) {
      localStorage.setItem('biz_token', res.token);
      navigate('/orders');
    } else {
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

  function goBack() {
    setError('');
    setInfo('');
    setView('login');
  }

  const cardClass = 'bg-white rounded-xl shadow-lg p-8 w-full max-w-sm space-y-4';
  const inputClass = 'w-full border rounded px-3 py-2';
  const btnClass = 'w-full bg-orange-600 text-white rounded py-2 font-semibold hover:bg-orange-500 disabled:opacity-50';

  if (view === 'forgot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <form onSubmit={handleForgot} className={cardClass}>
          <h1 className="text-2xl font-bold text-center text-orange-600">🏪 Recuperar contraseña</h1>
          <p className="text-sm text-gray-500 text-center">Ingresa tu correo y te enviaremos un código por WhatsApp.</p>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className={btnClass} disabled={loading}>{loading ? 'Enviando...' : 'Enviar código'}</button>
          <button type="button" className="w-full text-sm text-gray-500 hover:underline" onClick={goBack}>Volver al inicio de sesión</button>
        </form>
      </div>
    );
  }

  if (view === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <form onSubmit={handleReset} className={cardClass}>
          <h1 className="text-2xl font-bold text-center text-orange-600">🏪 Nueva contraseña</h1>
          {info && <p className="text-green-600 text-sm text-center">{info}</p>}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <input className={inputClass} type="text" placeholder="Código de 6 dígitos" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
          <input className={inputClass} type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
          <input className={inputClass} type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
          <button className={btnClass} disabled={loading}>{loading ? 'Guardando...' : 'Cambiar contraseña'}</button>
          <button type="button" className="w-full text-sm text-gray-500 hover:underline" onClick={goBack}>Volver al inicio de sesión</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <form onSubmit={handleLogin} className={cardClass}>
        <h1 className="text-2xl font-bold text-center text-orange-600">🏪 Mi Negocio</h1>
        {error && <p className={`text-sm text-center ${error.includes('actualizada') ? 'text-green-600' : 'text-red-500'}`}>{error}</p>}
        <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputClass} type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className={btnClass}>Ingresar</button>
        <button type="button" className="w-full text-sm text-orange-500 hover:underline" onClick={() => { setError(''); setView('forgot'); }}>
          ¿Olvidaste tu contraseña?
        </button>
      </form>
    </div>
  );
}
