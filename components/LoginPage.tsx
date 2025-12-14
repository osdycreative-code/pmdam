import React, { useState } from 'react';
import { Hexagon, Loader2, AlertCircle, ArrowRight, Github, Mail } from 'lucide-react';
import { dbLocal } from '../services/dexieDb';
import { supabase, deleteAllSupabaseData } from '../services/supabaseClient';
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
  
  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isPasswordValid = password.trim().length >= 8 && /[A-Z]/.test(password); // Added uppercase requirement
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
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
        if (error) throw error;
    } catch (err: any) {
        console.error("Google login error", err);
        setError("Error al iniciar sesión con Google.");
    }
  };

  const handleGithubLogin = async () => {
       try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    } catch (err: any) {
        console.error("Github login error", err);
        setError("Error al iniciar sesión con GitHub.");
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
            // Registration flow
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                }
            });

            if (error) throw error;

            if (data.session) {
                // Clear databases on fresh account
                await Dexie.delete('PManLocalDB'); 
                await dbLocal.delete();
                await dbLocal.open();
                
                window.location.reload();
            } else if (data.user) {
                 setSuccessMessage("¡Cuenta creada! Revisa tu correo para confirmar.");
                 // Optional: automatically switch to login view or keep showing success
                 setTimeout(() => {
                    setIsRegistering(false);
                    setSuccessMessage(null);
                 }, 5000);
            }

        } else {
            // Login flow
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
        if (err.message === "Invalid login credentials") {
            setError("Credenciales no válidas."); // Generic message as requested
        } else if (err.message.includes("User already registered")) {
            setError("Este correo ya está registrado.");
        } else {
            setError("Error de autenticación. Intenta de nuevo.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center p-4 relative font-sans text-gray-900">
      
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden p-8 sm:p-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
            <div className="mb-6 p-3 bg-gray-50 rounded-2xl">
                <Hexagon size={32} className="text-gray-900 stroke-[1.5]" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
                {isResetting ? 'Recuperar Contraseña' : (isRegistering ? 'Crear Cuenta' : 'Bienvenido de nuevo')}
            </h1>
            <p className="text-sm text-gray-500 text-center px-4">
                {isResetting 
                    ? 'Te enviaremos las instrucciones a tu correo' 
                    : (isRegistering ? 'Comienza tu experiencia hoy mismo' : 'Ingresa a tu espacio de trabajo')}
            </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-50/50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
             {successMessage && (
                <div className="bg-green-50/50 border border-green-100 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2.5 animate-[fadeIn_0.2s_ease-out]">
                    <span className="font-medium">✨ {successMessage}</span>
                </div>
            )}
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 pl-0.5">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all text-sm placeholder-gray-400"
                        placeholder="tu@correo.com"
                        required
                    />
                </div>

                {!isResetting && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 pl-0.5">Contraseña</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all text-sm placeholder-gray-400"
                            placeholder="Mínimo 8 caracteres, 1 mayúscula"
                            required={!isResetting}
                        />
                    </div>
                )}

                {isRegistering && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 pl-0.5">Confirmar Contraseña</label>
                        <input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-2.5 bg-gray-50/50 border rounded-lg focus:ring-2 outline-none transition-all text-sm placeholder-gray-400 ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-300 focus:ring-red-100' : 'border-gray-200 focus:border-gray-900 focus:ring-gray-900/10'}`}
                            placeholder="Repite tu contraseña"
                            required
                        />
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={!isFormValid || isLoading}
                className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 mt-2"
            >
                {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <>
                        {isResetting ? 'Enviar Enlace' : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')} 
                        {!isRegistering && !isResetting && <ArrowRight size={16} />}
                    </>
                )}
            </button>

             {/* Forgot Password Link - Secondary, under Main Button */}
             {!isRegistering && !isResetting && (
                <div className="flex justify-center">
                    <button 
                        type="button"
                        onClick={() => { setIsResetting(true); setError(null); }}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>
            )}
        </form>

        {/* Social Login Separator */}
        {!isResetting && (
             <div className="my-8">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider">
                        <span className="bg-white px-3 text-gray-400 font-medium">O continúa con</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                        onClick={handleGoogleLogin}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700"
                    >
                         <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                         Google
                    </button>
                     <button 
                        onClick={handleGithubLogin}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700"
                    >
                        <Github size={18} />
                        GitHub
                    </button>
                </div>
             </div>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-500">
                {isResetting ? (
                    <button 
                        type="button"
                        onClick={() => { setIsResetting(false); setError(null); }}
                        className="text-gray-900 font-medium hover:underline transition-all"
                    >
                        Volver al inicio de sesión
                    </button>
                ) : (
                    <>
                        {isRegistering ? '¿Ya tienes una cuenta?' : "¿No tienes una cuenta?"} 
                        <button 
                            type="button"
                            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                            className="ml-1.5 text-gray-900 font-medium hover:underline transition-all"
                        >
                            {isRegistering ? 'Inicia Sesión' : 'Crea una cuenta'}
                        </button>
                    </>
                )}
            </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-[10px] uppercase tracking-widest font-medium group">
         Secured by NexusFlow
         <button 
            type="button" 
            onClick={async () => {
                if (window.confirm("⚠️ HARD RESET: This will wipe ALL LOCAL and CLOUD data. Are you sure?")) {
                    try {
                        await deleteAllSupabaseData(); // Clean cloud
                        await Dexie.delete('PManLocalDB'); // Clean local Dexie
                        await dbLocal.delete();
                        console.log("Database reset complete. Reloading...");
                        window.location.reload();
                    } catch (e) {
                         console.error("Reset failed", e);
                         alert("Reset failed, check console");
                    }
                }
            }} 
            className="block mx-auto mt-4 px-2 py-1 bg-red-100 text-red-600 rounded text-[9px] opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            title="Dev: Wipe All Data"
         >
            Reset DB (Click to Wipe)
         </button>
      </div>
    </div>
  );
};
