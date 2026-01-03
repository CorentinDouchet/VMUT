import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Vérifier si un token existe au chargement
        const token = localStorage.getItem('token');
        if (token) {
            // Récupérer les infos utilisateur
            loadUserInfo();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUserInfo = async () => {
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Erreur lors du chargement des infos utilisateur:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const data = await authService.login(username, password);
            const { token, id, username: userName, email, role, fullName } = data;

            // Stocker le token
            localStorage.setItem('token', token);

            // Mettre à jour l'état utilisateur
            setUser({ id, username: userName, email, role, fullName });

            return { success: true };
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Identifiants incorrects'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const hasRole = (role) => {
        return user?.role === role;
    };

    const hasAnyRole = (roles) => {
        return roles.includes(user?.role);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        hasRole,
        hasAnyRole,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
