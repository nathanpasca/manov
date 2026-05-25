import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const res = await authService.me();
                    setUser(res.data);
                    setToken(storedToken);
                } catch (err) {
                    // Token is invalid or expired
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        validateToken();
    }, []);

    // Sync token with localStorage and keep user state on refresh
    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);

            // Decode user data dari localStorage kalau ada (opsional, biar gak hilang pas refresh)
            const storedUser = localStorage.getItem('user');
            if (storedUser) setUser(JSON.parse(storedUser));
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    }, [token]);

    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        // Redirect ke home bisa dihandle di component
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
