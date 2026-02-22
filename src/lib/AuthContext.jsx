import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/api/apiClient';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const USER_KEY = 'pv_user_cache'; // lightweight user cache for instant hydration

function saveSession(access, refresh, user) {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}

function loadCachedUser() {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
    const cachedUser = loadCachedUser();

    const [user, setUser] = useState(cachedUser);
    const [isAuthenticated, setIsAuthenticated] = useState(!!cachedUser);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Used by navigateToLogin to avoid circular react-router deps
    const navigateRef = useRef(null);

    // ── On mount: verify the stored token is still valid ──────────────────
    useEffect(() => {
        const token = appParams.token || localStorage.getItem(TOKEN_KEY);
        if (token) {
            if (appParams.token) localStorage.setItem(TOKEN_KEY, appParams.token);
            checkUserAuth();
        } else {
            setIsLoadingAuth(false);
            setIsAuthenticated(false);
            setUser(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Verify token with backend ──────────────────────────────────────────
    const checkUserAuth = useCallback(async () => {
        try {
            setIsLoadingAuth(true);
            const currentUser = await apiClient.auth.me();
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
                // Persist fresh user data
                localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            } else {
                // Token exists but me() returned null (maybe 401 was handled internally)
                clearSession();
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('[Auth] Token validation failed:', error);
            setIsAuthenticated(false);
            setUser(null);
            if (error.response?.status === 401 || error.response?.status === 403) {
                clearSession();
                setAuthError({ type: 'auth_required', message: 'Session expired. Please log in again.' });
            }
        } finally {
            setIsLoadingAuth(false);
        }
    }, []);

    // ── Login ──────────────────────────────────────────────────────────────
    const login = useCallback(async (credentials) => {
        try {
            setIsLoadingAuth(true);
            setAuthError(null);
            const response = await apiClient.auth.login(credentials);
            if (response.access) {
                saveSession(response.access, response.refresh, response.user);
                // Fetch full user profile
                const currentUser = await apiClient.auth.me();
                if (currentUser) {
                    setUser(currentUser);
                    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
                } else if (response.user) {
                    setUser(response.user);
                }
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, error: 'Login failed — no token received' };
        } catch (error) {
            const message = error.response?.data?.detail
                || error.response?.data?.non_field_errors?.[0]
                || 'Incorrect username or password';
            setAuthError({ type: 'login_failed', message });
            return { success: false, error: message };
        } finally {
            setIsLoadingAuth(false);
        }
    }, []);

    // ── Register ───────────────────────────────────────────────────────────
    const register = useCallback(async ({ username, email, password, confirm_password }) => {
        try {
            setIsLoadingAuth(true);
            setAuthError(null);
            const response = await apiClient.auth.register({ username, email, password, confirm_password });
            if (response.access) {
                saveSession(response.access, response.refresh, response.user);
                setUser(response.user);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, error: 'Registration failed' };
        } catch (error) {
            const data = error.response?.data;
            const message = data?.error || data?.detail || 'Registration failed. Please try again.';
            setAuthError({ type: 'register_failed', message });
            return { success: false, error: message };
        } finally {
            setIsLoadingAuth(false);
        }
    }, []);

    // ── Logout ─────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        // Blacklist refresh token on the backend so it can't be replayed
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (refresh) {
            try {
                await apiClient.auth.logout(refresh);
            } catch { /* ignore — local logout proceeds regardless */ }
        }
        clearSession();
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        // Navigate to login
        navigateToLogin();
    }, []);

    // ── Navigate helpers ───────────────────────────────────────────────────
    // The router isn't available here, so we use a simple location replacement.
    const navigateToLogin = useCallback((returnTo) => {
        const path = returnTo ? `/Login?next=${encodeURIComponent(returnTo)}` : '/Login';
        // Use window.location so this works outside React Router context
        if (window.location.pathname !== '/Login' && window.location.pathname !== '/SignUp') {
            window.location.href = path;
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoadingAuth,
            authError,
            setAuthError,
            login,
            register,
            logout,
            checkUserAuth,
            navigateToLogin,
            // Convenience: expose isLoadingPublicSettings for backward-compat with App.jsx
            isLoadingPublicSettings: false,
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
