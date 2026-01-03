package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Service utilitaire pour récupérer l'utilisateur connecté
 */
@Service
public class AuthenticationService {
    
    /**
     * Récupère le nom d'utilisateur de l'utilisateur actuellement connecté
     * @return Le nom d'utilisateur ou "system" si non authentifié
     */
    public String getCurrentUsername() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated() || 
                authentication.getPrincipal() instanceof String) {
                return "system";
            }
            
            if (authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
            }
            
            return authentication.getName();
        } catch (Exception e) {
            return "system";
        }
    }
    
    /**
     * Récupère l'ID de l'utilisateur actuellement connecté
     * @return L'ID utilisateur ou null si non authentifié
     */
    public Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
                return ((CustomUserDetails) authentication.getPrincipal()).getId();
            }
            
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Vérifie si un utilisateur est authentifié
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && 
               authentication.isAuthenticated() && 
               !(authentication.getPrincipal() instanceof String);
    }
}
