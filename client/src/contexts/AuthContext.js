import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const sessionUser = authService.restoreSession();
        if (sessionUser) {
            setUser(sessionUser);
        }
        setIsLoading(false);
    }, []);
    const login = async (payload) => {
        setIsLoading(true);
        try {
            const authUser = await authService.login(payload);
            setUser(authUser);
        }
        finally {
            setIsLoading(false);
        }
    };
    const register = async (payload) => {
        setIsLoading(true);
        try {
            const authUser = await authService.register(payload);
            setUser(authUser);
        }
        finally {
            setIsLoading(false);
        }
    };
    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUser(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    const updateUser = (updater) => {
        setUser((prev) => {
            if (!prev)
                return prev;
            const updated = updater(prev);
            storage.setUser(updated);
            return updated;
        });
    };
    const value = useMemo(() => ({
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateUser
    }), [user, isLoading]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
    }
    return context;
};
