import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { authService, LoginPayload, RegisterPayload } from '../services/authService';
import { AuthUser } from '../types/auth';
import { storage } from '../utils/storage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updater: (prev: AuthUser) => AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_LOADED_KEY = 'florte:auth-initially-loaded';

/** Evita desmontar rutas cuando AuthProvider remonta (HMR, isLoading vuelve a true). Persiste en sessionStorage para sobrevivir recargas de módulo. */
function getHasAuthInitiallyLoaded(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(AUTH_LOADED_KEY) === '1';
}

function setAuthInitiallyLoaded(): void {
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(AUTH_LOADED_KEY, '1');
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const sessionUser = authService.restoreSession();
    setAuthInitiallyLoaded();
    return sessionUser;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const authUser = await authService.login(payload);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const authUser = await authService.register(payload);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(AUTH_LOADED_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updater: (prev: AuthUser) => AuthUser) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      storage.setUser(updated);
      return updated;
    });
  };

  const effectiveLoading = isLoading && !getHasAuthInitiallyLoaded();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading: effectiveLoading,
      login,
      register,
      logout,
      updateUser
    }),
    [user, effectiveLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return context;
};
