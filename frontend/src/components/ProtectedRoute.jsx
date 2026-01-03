import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Composant pour protéger les routes selon l'authentification et les rôles
 */
const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh' 
            }}>
                <div>Chargement...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return (
            <div style={{ 
                padding: '40px', 
                textAlign: 'center' 
            }}>
                <h2>Accès refusé</h2>
                <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                <p>Rôle requis: {roles.join(' ou ')}</p>
                <p>Votre rôle: {user.role}</p>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
