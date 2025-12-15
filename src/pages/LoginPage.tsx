import React, { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
// import { useNavigate } from 'react-router-dom'; // Commented out as react-router-dom is not installed
import { useAuthStore } from '../stores/authStore'; // Hook simulado para estado global
import { dbService } from '../../services/db';

// Shim for useNavigate since react-router-dom is not present in package.json
const useNavigate = () => {
    return (path: string) => {
        console.log(`Navigating to ${path}`);
        // In a single page app without router, we might just reload or change hash
        // For now, force reload to '/' which will trigger App.tsx to check auth token
        window.location.href = path === '/app' ? '/' : path;
    };
};

// --- INTERFACES Y CONFIGURACIÓN ---

const API_BASE_URL = 'http://localhost:3000/api/auth/login';

interface LoginFormState {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

// --- UTILIDADES ---

const isValidEmail = (email: string): boolean => {
  // Regex de validación de email simple
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- COMPONENTE PRINCIPAL ---

const LoginPage: React.FC = () => {
  const [formState, setFormState] = useState<LoginFormState>({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();
  const authStore = useAuthStore(); // Asume que este hook guarda el token globalmente

  /**
   * Valida el formulario antes del envío.
   */
  const validateForm = useCallback((state: LoginFormState): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (!state.email) {
      errors.email = 'El email es requerido.';
    } else if (!isValidEmail(state.email)) {
      errors.email = 'El formato del email no es válido.';
    }
    
    if (!state.password) {
      errors.password = 'La contraseña es requerida.';
    }
    
    return errors;
  }, []);

  /**
   * Maneja los cambios en los campos de entrada.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    // Limpia errores de validación en el cambio
    setValidationErrors({});
    setApiError(null);
  };

  /**
   * 🔑 Maneja el envío del formulario e interacción con el endpoint JWT.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formState);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await axios.post<{ access_token: string }>(
        API_BASE_URL,
        formState
      );
      
      const token = response.data.access_token;
      
      // *** 🔑 GESTIÓN DEL JWT CLAVE ***
      
      // 1. Almacenar el token de acceso (Modificado para usar DB local en lugar de localStorage)
      await dbService.saveAuthToken(token);
      
      // 2. Configurar Axios para enviar el token automáticamente en futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 3. (Opcional) Actualizar el estado global de la aplicación
      // Nota: authStore.login ya interactúa con dbService en nuestra implementación, pero mantenemos la llamada
      await authStore.login(token); 

      console.log("Inicio de sesión exitoso. Redirigiendo...");
      navigate('/app'); // Redirigir al dashboard principal

    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      
      if (err.response && err.response.status === 401) {
        setApiError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
      } else {
        // Log error details for debugging
        console.error("Login Error:", err);
        setApiError('Ha ocurrido un error en el servidor. Inténtalo de nuevo.');
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Iniciar Sesión en Plataforma</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        
        {/* Campo de Email */}
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

        {/* Campo de Contraseña */}
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
        
        {/* Mensaje de Error de API */}
        {apiError && <div style={styles.apiErrorBox}>{apiError}</div>}

        {/* Botón de Envío */}
        <button 
          type="submit" 
          disabled={isLoading || Object.keys(validateForm(formState)).length > 0}
          style={styles.button}
        >
          {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

// --- ESTILOS BÁSICOS (Para simular la UI) ---

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f4f7f9',
  },
  title: {
    marginBottom: '20px',
    color: '#333',
  },
  form: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    minWidth: '350px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    marginTop: '15px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    fontSize: '16px',
  },
  button: {
    width: '100%',
    padding: '12px',
    marginTop: '30px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  errorText: {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '5px',
  },
  apiErrorBox: {
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    marginTop: '20px',
    textAlign: 'center',
  }
};

export default LoginPage;