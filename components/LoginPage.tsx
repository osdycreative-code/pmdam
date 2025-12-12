
import React, { useState } from 'react';
import { Hexagon, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { dbService } from '../services/db';
import { supabase } from '../services/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Basic Validation Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isFormValid = isEmailValid && (isResetting || password.trim().length > 0);

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isEmailValid) return;

      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: window.location.origin + '/reset-password', // Ensure you have a route for this or generic app open
          });

          if (error) throw error;
          setSuccessMessage("Check your email for the password reset link.");
      } catch (err: any) {
          console.error("Reset password error", err);
          setError(err.message || "Failed to send reset email.");
      } finally {
          setIsLoading(false);
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
                await dbService.clearDatabase();
                await dbService.init();

                // Get the session immediately if auto-confirmed (or handle email confirmation flow)
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token;
                
                if (token) {
                    await dbService.saveAuthToken(token);
                    // Force reload to clear App's in-memory state since we wiped the DB
                    window.location.reload();
                } else {
                    // If email confirmation is required, Supabase might not return a session immediately
                     setSuccessMessage("Account created! Please check your email to confirm.");
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
                setError("Login succeeded but no session was returned.");
            }
        }
    } catch (err: any) {
        console.error("Authentication error", err);
        setError(err.message || "Authentication failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-600 to-indigo-800 transform -skew-y-6 origin-top-left -translate-y-20 z-0"></div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl z-10 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-full mb-6 text-indigo-600 shadow-sm">
                <Hexagon size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isResetting ? 'Reset Password' : (isRegistering ? 'Create Account' : 'Welcome Back')}
            </h1>
            <p className="text-sm text-gray-500">
                {isResetting 
                    ? 'Enter your email to receive reset instructions' 
                    : (isRegistering ? 'Join NexusFlow to start organizing' : 'Sign in to access your NexusFlow workspace')}
            </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
             {successMessage && (
                <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]">
                    <div className="shrink-0 mt-0.5">✨</div>
                    <span>{successMessage}</span>
                </div>
            )}
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm
                                ${email && !isEmailValid ? 'border-red-300 focus:ring-red-200' : 'border-gray-200'}
                            `}
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                </div>

                {!isResetting && (
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex justify-between">
                            <span>Password</span>
                            {!isRegistering && (
                                <button 
                                    type="button"
                                    onClick={() => { setIsResetting(true); setError(null); }}
                                    className="text-indigo-600 hover:text-indigo-800 capitalize font-medium transition-all duration-200 hover:underline"
                                >
                                    Forgot?
                                </button>
                            )}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Lock size={18} />
                            </div>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                placeholder="••••••••"
                                required={!isResetting}
                            />
                        </div>
                    </div>
                )}
            </div>

            <button 
                type="submit" 
                disabled={!isFormValid || isLoading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 hover:border-indigo-300 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.98]"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        {isResetting ? 'Sending Link...' : (isRegistering ? 'Creating Account...' : 'Signing In...')}
                    </>
                ) : (
                    <>
                        {isResetting ? 'Send Reset Link' : (isRegistering ? 'Sign Up' : 'Sign In')} 
                        {!isResetting && <ArrowRight size={18} />}
                    </>
                )}
            </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
                {isResetting ? (
                    <button 
                        type="button"
                        onClick={() => { setIsResetting(false); setError(null); }}
                        className="text-indigo-600 font-bold hover:underline transition-all duration-200"
                    >
                        Back to Login
                    </button>
                ) : (
                    <>
                        {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
                        <button 
                            type="button"
                            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                            className="ml-1 text-indigo-600 font-bold hover:underline transition-all duration-200"
                        >
                            {isRegistering ? 'Sign In' : 'Create one'}
                        </button>
                    </>
                )}
            </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-xs">
          &copy; 2024 NexusFlow Inc. All rights reserved.
      </div>
    </div>
  );
};
