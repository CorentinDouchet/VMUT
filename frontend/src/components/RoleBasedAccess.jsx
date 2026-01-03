import { useAuth } from '../contexts/AuthContext';

/**
 * Composant pour afficher du contenu selon les rôles
 * @param {Array} allowedRoles - Liste des rôles autorisés (ex: ['MAINTENANCE', 'ADMINISTRATEUR'])
 * @param {React.ReactNode} children - Contenu à afficher si l'utilisateur a le bon rôle
 * @param {React.ReactNode} fallback - Contenu à afficher si l'utilisateur n'a pas le bon rôle
 */
export const RoleBasedAccess = ({ allowedRoles, children, fallback = null }) => {
  const { user, hasAnyRole } = useAuth();

  if (!user) {
    return fallback;
  }

  return hasAnyRole(allowedRoles) ? children : fallback;
};

/**
 * Composant pour masquer du contenu selon les rôles
 * @param {Array} hiddenForRoles - Liste des rôles pour lesquels masquer le contenu
 */
export const HideForRoles = ({ hiddenForRoles, children }) => {
  const { user, hasAnyRole } = useAuth();

  if (!user) {
    return null;
  }

  return hasAnyRole(hiddenForRoles) ? null : children;
};

/**
 * Hook personnalisé pour vérifier les permissions
 */
export const usePermissions = () => {
  const { user, hasRole, hasAnyRole } = useAuth();

  return {
    // Vérifier si l'utilisateur peut modifier
    canEdit: hasAnyRole(['AUTEUR', 'MAINTENANCE']),
    
    // Vérifier si l'utilisateur peut administrer
    canAdmin: hasAnyRole(['ADMINISTRATEUR', 'MAINTENANCE']),
    
    // Vérifier si l'utilisateur peut importer
    canImport: hasAnyRole(['AUTEUR', 'MAINTENANCE']),
    
    // Vérifier si l'utilisateur est en lecture seule
    isReadOnly: hasRole('CONSULTANT'),
    
    // Vérifier si c'est un utilisateur maintenance
    isMaintenance: hasRole('MAINTENANCE'),
    
    // Accès à l'utilisateur et aux fonctions de base
    user,
    hasRole,
    hasAnyRole
  };
};
