import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { LoadingSpinner, UsersIcon } from '../IconComponents';

const UserManagementPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                // Supabase puede tener la confirmación por email habilitada.
                // Es importante informar al usuario sobre esto.
                if (data.user.identities && data.user.identities.length === 0) {
                     setSuccess(`¡Usuario creado! Se ha enviado un correo de confirmación a ${email}. El usuario debe verificar su email para poder iniciar sesión.`);
                } else {
                     setSuccess(`¡Usuario ${email} creado con éxito! Ahora puede iniciar sesión con sus credenciales.`);
                }
                setEmail('');
                setPassword('');
            } else {
                 throw new Error("No se pudo crear el usuario, pero no se recibió un error explícito.");
            }

        } catch (err: any) {
            console.error("Error creando usuario:", err);
            if (err.message.includes("User already registered")) {
                setError("Este correo electrónico ya está registrado.");
            } else {
                setError(err.message || 'Ocurrió un error al crear el usuario.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                 <UsersIcon className="w-8 h-8 text-indigo-400" />
                <h2 className="text-2xl font-bold text-white">Gestión de Usuarios Administradores</h2>
            </div>
            
            <div className="bg-yellow-900/40 p-4 rounded-lg border border-yellow-700/50 mb-6 text-sm">
                <p className="font-bold text-yellow-300">¡Atención!</p>
                <p className="text-yellow-400 mt-1">
                    Crear un nuevo usuario aquí le otorgará **acceso completo al panel de administración**. Use esta función con precaución y solo para personal de confianza.
                    La gestión (borrado, cambio de contraseña) de usuarios se debe realizar directamente en el <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">panel de Supabase</a> por seguridad.
                </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
                <div>
                    <label htmlFor="new-email" className="block text-sm font-medium text-gray-300">
                        Email del Nuevo Usuario
                    </label>
                    <input
                        id="new-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-3 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="ejemplo@dominio.com"
                    />
                </div>
                <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-300">
                        Contraseña Temporal
                    </label>
                    <input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-3 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>

                {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-lg text-center text-sm">{error}</p>}
                {success && <p className="text-green-400 bg-green-900/20 p-3 rounded-lg text-center text-sm">{success}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? <LoadingSpinner className="w-5 h-5" /> : 'Crear Usuario Administrador'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserManagementPage;