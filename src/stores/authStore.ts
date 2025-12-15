import { dbService } from '../../services/db';

/**
 * Hook simulado para estado global de autenticación.
 * En una aplicación real, esto usaría Zustand, Redux o Context API.
 */
export const useAuthStore = () => {
  const login = async (token: string) => {
    try {
      await dbService.saveAuthToken(token);
      console.log('Token guardado en base de datos local');
    } catch (error) {
      console.error('Error guardando token:', error);
    }
  };

  const logout = async () => {
    try {
      await dbService.clearAuthToken();
      console.log('Token eliminado de la base de datos local');
    } catch (error) {
       console.error('Error eliminando token:', error);
    }
  };

  const checkAuth = async (): Promise<boolean> => {
      const token = await dbService.getAuthToken();
      return !!token;
  };

  return { login, logout, checkAuth };
};
