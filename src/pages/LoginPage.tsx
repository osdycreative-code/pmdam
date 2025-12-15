import React, { useState, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
// import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { dbService } from '../../services/db';

// Shim for useNavigate
const useNavigate = () => {
    return (path: string) => {
        console.log(`Navigating to ${path}`);
        window.location.href = path === '/app' ? '/' : path;
    };
};

interface LoginFormState {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

// --- UTILS ---
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- MAIN COMPONENT ---
const LoginPage: React.FC = () => {
  const [formState, setFormState] = useState<LoginFormState>({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false); // Toggle state
  
  const navigate = useNavigate();
  const authStore = useAuthStore();

  const validateForm = useCallback((state: LoginFormState): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (!state.email) {
      errors.email = 'El email es requerido.';
    } else if (!isValidEmail(state.email)) {
      errors.email = 'El formato del email no es válido.';
    }
    if (!state.password) {
      errors.password = 'La contraseña es requerida.';
    } else if (state.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return errors;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    setValidationErrors({});
    setApiError(null);
    setApiSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formState);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiSuccess(null);

    try {
        if (isRegistering) {
            // --- SIGN UP ---
            const { data, error } = await supabase.auth.signUp({
                email: formState.email,
                password: formState.password,
            });

            if (error) throw error;

            if (data.user && !data.session) {
                setApiSuccess('Cuenta creada exitosamente. ¡Revisa tu email para confirmar!');
                // Optional: switch back to login or stay here
            } else if (data.session) {
                // Auto-login if confirmation not required
                 await handleLoginSuccess(data.session.access_token);
            }

        } else {
            // --- LOGIN ---
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formState.email,
                password: formState.password,
            });

            if (error) throw error;

            if (data.session) {
                await handleLoginSuccess(data.session.access_token);
            }
        }

    } catch (error: any) {
        console.error("Auth Error:", error);
        setApiError(error.message || 'Ha ocurrido un error. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = async (token: string) => {
      // 1. Store locally
      await dbService.saveAuthToken(token);
      // 2. Update store
      await authStore.login(token);
      
      console.log("Inicio de sesión exitoso. Redirigiendo...");
      navigate('/app');
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
          {isRegistering ? 'Crear Nueva Cuenta' : 'Iniciar Sesión'}
      </h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        
        <label htmlFor="email" style={styles.label}>Email:</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formState.email}
          onChange={handleInputChange}
          style={styles.input}
          aria-invalid={validationErrors.email ? true : undefined}
        />
        {validationErrors.email && <p style={styles.errorText}>{validationErrors.email}</p>}

        <label htmlFor="password" style={styles.label}>Contraseña:</label>
        <input
          type="password"
          name="password"
          id="password"
          value={formState.password}
          onChange={handleInputChange}
          style={styles.input}
          aria-invalid={validationErrors.password ? true : undefined}
        />
        {validationErrors.password && <p style={styles.errorText}>{validationErrors.password}</p>}
        
        {apiError && <div style={styles.apiErrorBox}>{apiError}</div>}
        {apiSuccess && <div style={styles.apiSuccessBox}>{apiSuccess}</div>}

        <button 
          type="submit" 
          disabled={isLoading}
          style={styles.button}
        >
          {isLoading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
        </button>

        <div style={styles.footerLink}>
            <button 
                type="button" 
                onClick={() => setIsRegistering(!isRegistering)}
                style={styles.linkButton}
            >
                {isRegistering 
                    ? '¿Ya tienes cuenta? Inicia sesión aquí' 
                    : '¿No tienes cuenta? Regístrate aquí'}
            </button>
        </div>
      </form>
    </div>
  );
};

// --- STYLES ---

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f4f7f9',
    padding: '10px',
  },
  title: {
    marginBottom: '15px',
    color: '#333',
    fontSize: '1.5rem',
    marginTop: '0',
  },
  form: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    minWidth: '320px',
    maxWidth: '400px',
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    marginTop: '12px',
    fontWeight: 'bold',
    color: '#555',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '14px',
    height: '36px',
  },
  button: {
    width: '100%',
    padding: '10px',
    marginTop: '20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    height: '40px',
    display: 'flex',
      alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#dc3545',
    fontSize: '11px',
    marginTop: '4px',
    marginBottom: '0',
  },
  apiErrorBox: {
    padding: '8px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '13px',
  },
  apiSuccessBox: {
    padding: '8px',
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '13px',
  },
  footerLink: {
      marginTop: '20px',
      textAlign: 'center',
      fontSize: '14px',
  },
  linkButton: {
      background: 'none',
      border: 'none',
      color: '#007bff',
      cursor: 'pointer',
      textDecoration: 'underline',
      padding: 0,
      fontFamily: 'inherit',
      fontSize: 'inherit',
  }
};

export default LoginPage;