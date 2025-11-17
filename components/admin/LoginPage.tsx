import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { LoadingSpinner, ArrowLeftIcon } from '../IconComponents';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      // El listener en AuthContext se encargará de redirigir
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <h1 className="text-3xl font-bold text-white mt-4">Acceso al Panel</h1>
            <p className="text-gray-400">Inicia sesión para gestionar los vehículos.</p>
        </div>
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-3 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">Contraseña</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-3 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? <LoadingSpinner className="w-5 h-5" /> : 'Iniciar Sesión'}
                </button>
            </div>
          </form>
        </div>
        <div className="text-center mt-6">
            <a href="#/" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Volver al cotizador</span>
            </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;