import React, { useState } from 'react';
import axios from 'axios';

// Definir la interfaz para el estado del formulario
interface LoginFormState {
  email: string;
  password: string;
}

// Simulación del hook de contexto para almacenar y gestionar el token
// En una implementación real, esto sería un hook personalizado que interactúa con IndexedDB
import { dbService } from '../../services/db';

const useAuthStore = () => {
  const login = async (token: string) => {
    // Simulación de almacenamiento del token en IndexedDB
    try {
      await dbService.saveAuthToken(token);
      console.log('Token almacenado en IndexedDB:', token);
    } catch (err) {
      console.error('Error al almacenar el token:', err);
    }
  };

  return { login };
};

const LoginPage: React.FC = () => {
  // Estado del formulario
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: ''
  });
  
  // Estados adicionales
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Hook de autenticación
  const authStore = useAuthStore();
  
  // Función para actualizar el estado del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores de validación al escribir
    if (validationError) {
      setValidationError(null);
    }
  };
  
  // Función de validación del formulario
  const validateForm = (): boolean => {
    // Verificar que ambos campos no estén vacíos
    if (!formState.email.trim() || !formState.password.trim()) {
      setValidationError('Todos los campos son obligatorios');
      return false;
    }
    
    // Validación básica del formato del email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email)) {
      setValidationError('Por favor ingrese un email válido');
      return false;
    }
    
    // Si pasa todas las validaciones
    setValidationError(null);
    return true;
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar el formulario
    if (!validateForm()) {
      return;
    }
    
    // Establecer estado de carga
    setIsLoading(true);
    setError(null);
    
    try {
      // Realizar petición POST al endpoint de autenticación
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: formState.email,
        password: formState.password
      });
      
      // Extraer el access_token de la respuesta
      const { access_token } = response.data;
      
      // Almacenar el token usando el hook de autenticación
      await authStore.login(access_token);
      
      // Redirigir al usuario a la página principal
      // En una aplicación real, aquí se usaría history.push('/app') o similar
      console.log('Inicio de sesión exitoso. Redirigiendo a /app');
      window.location.href = '/app';
      
    } catch (err: any) {
      // Manejo de errores
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Credenciales inválidas. Por favor verifique sus datos.');
        } else {
          setError('Ocurrió un error durante el inicio de sesión. Por favor intente nuevamente.');
        }
      } else {
        setError('Ocurrió un error inesperado. Por favor intente nuevamente.');
      }
    } finally {
      // Restablecer estado de carga
      setIsLoading(false);
    }
  };
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#333'
        }}>
          Iniciar Sesión
        </h1>
        
        {validationError && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}>
            {validationError}
          </div>
        )}
        
        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Ingrese su email"
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#374151'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formState.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="Ingrese su contraseña"
            />
          </div>
          
          <button
            type="submit"
            disabled={!validateForm() || isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: validateForm() && !isLoading ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: validateForm() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;