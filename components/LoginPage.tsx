
import React, { useState } from 'react';
import { Hexagon, Mail, Lock, Loader2, AlertCircle, ArrowRight, Github } from 'lucide-react';
import { dbLocal } from '../services/dexieDb';
import { supabase } from '../services/supabaseClient';
import Dexie from 'dexie';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Basic Validation Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.trim().length >= 8;
  const isConfirmValid = !isRegistering || (password === confirmPassword);
  
  const isFormValid = isEmailValid && (isResetting || (isPasswordValid && isConfirmValid));

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isEmailValid) return;

      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin + '/reset-password',
          });

          if (error) throw error;
          setSuccessMessage("Revisa tu correo para el enlace de recuperación.");
      } catch (err: any) {
          console.error("Reset password error", err);
          setError(err.message || "Error al enviar correo de recuperación.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleGoogleLogin = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    } catch (err: any) {
        console.error("Google login error", err);
        setError("Error al iniciar sesión con Google.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    if (isResetting) {
        await handleResetPassword(e);
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
        if (isRegistering) {
            // Registration flow - create new user with Supabase
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Clear local database to ensure a fresh start for the new account
                // This resolves the issue where creating an account showed previous data
                // await dbService.clearDatabase(); // Clears NexusFlowDB - DEPRECATED
                await Dexie.delete('PManLocalDB'); // Clears new local persistence DB
                // Clear local data on fresh start if needed, or handle differently.
                // For now, let's keep it simple. If valid login, we might not want to clear EVERYTHING,
                // but if the user requested a fresh start or it's a new user, we might.
                // The original code cleared the DB on successful login mock.
                // With Supabase, we rely on syncing.
                // If we want to clear strictly local state to avoid conflicts from another user:
                await dbLocal.delete(); // Deletes the entire IndexedDB
                await dbLocal.open(); // Re-opens (re-creates) it
                
                // Note: Auth token storage is handled by Supabase client (in memory or localStorage by default,
                // but we configured it to memory/custom in supabaseClient.ts? No, we set persistSession: false there).
                // Actually, supabaseClient.ts says: "persistSession: false // We handle persistence manually via dbService"
                // We should probably rely on Supabase's default persistence or simple localStorage for the token if not using cookies.
                // For this refactor, let's assume session is handled by the AuthProvider context.
    // Force reload to clear App's in-memory state since we wiped the DB
                    window.location.reload();
                } else {
                    // If email confirmation is required, Supabase might not return a session immediately
                     setSuccessMessage("¡Cuenta creada! Revisa tu correo para confirmar.");
                     setTimeout(() => {
                        setIsRegistering(false);
                        setSuccessMessage(null);
                     }, 5000);
                }
            }
        } else {
            // Login flow - authenticate with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                onLoginSuccess(data.session.access_token);
            } else {
                setError("Login exitoso pero no se obtuvo sesión.");
            }
        }
    } catch (err: any) {
        console.error("Authentication error", err);
        // UX: Readable error messages
        if (err.message === "Invalid login credentials") {
            setError("Correo o contraseña incorrectos.");
        } else if (err.message.includes("User already registered")) {
            setError("Este correo ya está registrado.");
        } else {
            setError(err.message || "Error de autenticación. Intenta de nuevo.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center items-center p-4 relative font-sans text-gray-900">
      
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
            <div className="mb-6">
                <Hexagon size={40} className="text-gray-900 stroke-1" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
                {isResetting ? 'Recuperar Contraseña' : (isRegistering ? 'Crear Cuenta' : 'Bienvenido')}
            </h1>
            <p className="text-sm text-gray-500">
                {isResetting 
                    ? 'Ingresa tu correo para recibir instrucciones' 
                    : (isRegistering ? 'Ingresa tus datos para comenzar' : 'Ingresa tus credenciales para acceder')}
            </p>
        </div>

        {/* Social Login */}
        {!isResetting && (
             <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleGoogleLogin}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                         <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                         Google
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors pointer-events-none opacity-60">
                        <Github size={16} />
                        GitHub
                    </button>
                </div>
                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-400">O continúa con</span>
                    </div>
                </div>
             </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-md text-sm flex items-start gap-2 animate-[fadeIn_0.2s_ease-out]">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
             {successMessage && (
                <div className="bg-green-50 border border-green-100 text-green-600 px-3 py-2 rounded-md text-sm flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
                    <span>✨ {successMessage}</span>
                </div>
            )}
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                    <div className="relative">
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm placeholder-gray-400"
                            placeholder="name@company.com"
                            required
                        />
                    </div>
                </div>

                {!isResetting && (
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-medium text-gray-700">Contraseña</label>
                                {!isRegistering && (
                                    <button 
                                        type="button"
                                        onClick={() => { setIsResetting(true); setError(null); }}
                                        className="text-xs text-gray-500 hover:text-gray-900 font-medium transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all text-sm placeholder-gray-400"
                                    placeholder="••••••••"
                                    required={!isResetting}
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        {isRegistering && (
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirmar Contraseña</label>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-gray-900 outline-none transition-all text-sm placeholder-gray-400 ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-300 focus:ring-red-200' : 'border-gray-200 focus:border-gray-900'}`}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={!isFormValid || isLoading}
                className="w-full bg-gray-900 text-white font-medium py-2 rounded-lg hover:bg-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm mt-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        {isResetting ? 'Enviando...' : 'Espera un momento...'}
                    </>
                ) : (
                    <>
                        {isResetting ? 'Enviar Enlace' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')} 
                        {!isResetting && <ArrowRight size={16} />}
                    </>
                )}
            </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
                {isResetting ? (
                    <button 
                        type="button"
                        onClick={() => { setIsResetting(false); setError(null); }}
                        className="text-gray-900 font-medium hover:underline transition-all"
                    >
                        Volver

                    </button>
                ) : (
                    <>
                        {isRegistering ? '¿Ya tienes cuenta?' : "¿No tienes cuenta?"} 
                        <button 
                            type="button"
                            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                            className="ml-1 text-gray-900 font-medium hover:underline transition-all"
                        >
                            {isRegistering ? 'Iniciar Sesión' : 'Regístrate'}
                        </button>
                    </>
                )}
            </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-[10px] uppercase tracking-wider">
          &copy; 2024 NexusFlow Inc.
      </div>
    </div>
  );
};
