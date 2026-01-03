package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.AssetGroup;
import com.mbda.mbdhackuity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour la gestion des groupes d'assets
 * STB_REQ_0101
 */
@Repository
public interface AssetGroupRepository extends JpaRepository<AssetGroup, Long> {
    
    /**
     * Rechercher un groupe par son nom
     */
    Optional<AssetGroup> findByName(String name);
    
    /**
     * Vérifier si un groupe existe avec ce nom
     */
    boolean existsByName(String name);
    
    /**
     * Trouver tous les groupes auxquels un utilisateur est rattaché
     */
    @Query("SELECT g FROM AssetGroup g JOIN g.users u WHERE u.id = :userId")
    List<AssetGroup> findGroupsByUserId(@Param("userId") Long userId);
    
    /**
     * Trouver tous les groupes contenant un utilisateur spécifique
     */
    List<AssetGroup> findByUsersContaining(User user);
    
    /**
     * Rechercher des groupes par conteneur PLM
     */
    List<AssetGroup> findByPlmContainer(String plmContainer);
    
    /**
     * Rechercher des groupes dont le nom contient le texte
     */
    List<AssetGroup> findByNameContainingIgnoreCase(String searchTerm);
}
