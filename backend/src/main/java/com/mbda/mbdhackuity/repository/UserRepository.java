package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.User;
import com.mbda.mbdhackuity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des utilisateurs
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Recherche un utilisateur par son nom d'utilisateur
     */
    Optional<User> findByUsername(String username);
    
    /**
     * Recherche un utilisateur par son email
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Vérifie si un nom d'utilisateur existe déjà
     */
    boolean existsByUsername(String username);
    
    /**
     * Vérifie si un email existe déjà
     */
    boolean existsByEmail(String email);
    
    /**
     * Récupère tous les utilisateurs par rôle
     */
    List<User> findByRole(Role role);
    
    /**
     * Récupère tous les utilisateurs actifs
     */
    List<User> findByEnabledTrue();
    
    /**
     * Récupère tous les utilisateurs désactivés
     */
    List<User> findByEnabledFalse();
    
    /**
     * Compte le nombre d'utilisateurs par rôle
     */
    long countByRole(Role role);
    
    /**
     * Recherche des utilisateurs par nom ou prénom
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchUsers(String searchTerm);
}
