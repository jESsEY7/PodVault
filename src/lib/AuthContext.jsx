import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const token = appParams.token || localStorage.getItem('access_token');
        if (token) {
            localStorage.setItem('access_token', token);
            checkUserAuth();
        } else {
            setIsLoadingAuth(false);
        }
    }, [appParams.token]);

    const checkUserAuth = async () => {
        try {
            setIsLoadingAuth(true);
            const currentUser = await apiClient.auth.me();
            setUser(currentUser);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('User auth check failed:', error);
            setIsAuthenticated(false);
            setUser(null);
            // If user auth fails, it might be an expired token
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('access_token');
                setAuthError({
                    type: 'auth_required',
                    message: 'Authentication required'
                });
            }
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const login = async (credentials) => {
        try {
            setIsLoadingAuth(true);
            const response = await apiClient.auth.login(credentials);
            if (response.access) {
                localStorage.setItem('access_token', response.access);
                await checkUserAuth();
                return true;
            }
            return false;
        } catch (error) {
            setAuthError({
                type: 'login_failed',
                message: error.response?.data?.detail || 'Login failed'
            });
            return false;
        } finally {
            setIsLoadingAuth(false);
        }
    };

    const logout = () => {
        apiClient.auth.logout();
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('access_token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            login,
            logout,
            checkUserAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
