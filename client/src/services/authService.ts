import { AxiosError } from 'axios';
import { apiClient } from './apiClient';
import { storage } from '../utils/storage';
import { normalizeAuthUserMedia } from '../utils/media';
import { AuthResponse, AuthUser } from '../types/auth';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

const handleAuthResponse = (response: AuthResponse): AuthUser => {
  if (response.tokens?.accessToken && response.tokens?.refreshToken) {
    storage.setSession(response.tokens.accessToken, response.tokens.refreshToken);
  }
  if (response.user) {
    const normalizedUser = normalizeAuthUserMedia(response.user);
    storage.setUser(normalizedUser);
    return normalizedUser;
  }
  throw new Error('Respuesta de autenticacion invalida');
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Error de conexión
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Verifica que el servidor esté ejecutándose.';
    }
    
    const responseData = error.response.data;
    
    // Error del servidor con mensaje
    if (responseData?.message) {
      return responseData.message;
    }
    
    // Errores de validación de Zod
    if (responseData?.errors && typeof responseData.errors === 'object') {
      const fieldErrors = responseData.errors.fieldErrors || responseData.errors.formErrors || {};
      const firstError = Object.values(fieldErrors).flat()[0];
      if (firstError) {
        return String(firstError);
      }
    }
    
    // Error HTTP sin mensaje específico
    if (error.response.status === 400) {
      return 'Datos inválidos. Por favor, verifica la información ingresada.';
    }
    if (error.response.status === 401) {
      return 'Credenciales inválidas. Verifica tu correo y contraseña.';
    }
    if (error.response.status === 403) {
      return 'Tu cuenta está suspendida. Contacta a un administrador.';
    }
    if (error.response.status === 409) {
      return 'El correo ya está registrado.';
    }
    if (error.response.status >= 500) {
      return 'Error del servidor. Por favor, intenta más tarde.';
    }
    return `Error: ${error.response.status} ${error.response.statusText}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
};

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
      return handleAuthResponse(data);
    } catch (error) {
      const message = extractErrorMessage(error);
      throw new Error(message);
    }
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
      return handleAuthResponse(data);
    } catch (error) {
      const message = extractErrorMessage(error);
      throw new Error(message);
    }
  },

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken();
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    storage.clear();
  },

  async forgotPassword(email: string): Promise<string> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
    return data.message;
  },

  async resetPassword(token: string, password: string): Promise<string> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/reset-password', { token, password });
    return data.message;
  },

  restoreSession(): AuthUser | null {
    return storage.getUser<AuthUser>();
  }
};
