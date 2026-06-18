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
    const res = await api.login(email, password);
    if (res.token) {
      localStorage.setItem('admin_token', res.token);
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">🏘️ Colonia Admin</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-gray-900 text-white rounded py-2 font-semibold hover:bg-gray-700">Ingresar</button>
      </form>
    </div>
  );
}
