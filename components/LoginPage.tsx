
import React, { useState } from 'react';
import { Hexagon, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { dbService } from '../services/db';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Basic Validation Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isFormValid = isEmailValid && password.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    // Simulate Network Request
    setTimeout(async () => {
        try {
            if (isRegistering) {
                // Registration flow - create new user
                const mockToken = `mock-jwt-token-${btoa(email)}`;
                await dbService.saveAuthToken(mockToken);
                onLoginSuccess(mockToken);
            } else {
                // Login flow - check if user exists
                const token = await dbService.getAuthToken();
                if (token) {
                    // Token exists, verify it's for the same email
                    const decodedEmail = atob(token.replace('mock-jwt-token-', ''));
                    if (decodedEmail === email) {
                        onLoginSuccess(token);
                    } else {
                        setError("Invalid credentials. Please check your email and password.");
                    }
                } else {
                    setError("No account found. Please register first.");
                }
            }
        } catch (err) {
            console.error("Authentication error", err);
            setError("Authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, 1000);
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="text-sm text-gray-500">
                {isRegistering ? 'Join NexusFlow to start organizing (Local)' : 'Sign in to access your NexusFlow workspace (Local)'}
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
                            placeholder="user@local.dev"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex justify-between">
                        <span>Password</span>
                        {!isRegistering && <a href="#" className="text-indigo-600 hover:text-indigo-800 capitalize font-medium transition-all duration-200 hover:border-indigo-200 border border-transparent">Forgot?</a>}
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
                            required
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={!isFormValid || isLoading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all duration-200 hover:border-indigo-300 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.98]"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        {isRegistering ? 'Creating Account...' : 'Signing In...'}
                    </>
                ) : (
                    <>
                        {isRegistering ? 'Sign Up' : 'Sign In'} <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
                <button 
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                    className="ml-1 text-indigo-600 font-bold hover:underline transition-all duration-200 hover:border-indigo-200 border border-transparent"
                >
                    {isRegistering ? 'Sign In' : 'Create one'}
                </button>
            </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-xs">
          &copy; 2024 NexusFlow Inc. All rights reserved.
      </div>
    </div>
  );
};
