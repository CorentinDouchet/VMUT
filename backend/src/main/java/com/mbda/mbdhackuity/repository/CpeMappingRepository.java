package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.CpeMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour les mappings CPE manuels (STB_REQ_0210)
 */
@Repository
public interface CpeMappingRepository extends JpaRepository<CpeMapping, Long> {
    
    /**
     * Recherche un mapping exact par nom et version de package
     */
    Optional<CpeMapping> findByPackageNameAndPackageVersionAndIsActiveTrue(String packageName, String packageVersion);
    
    /**
     * Recherche un mapping générique par nom de package (sans version spécifique)
     */
    @Query("SELECT c FROM CpeMapping c WHERE LOWER(c.packageName) = LOWER(:packageName) AND c.packageVersion IS NULL AND c.isActive = true")
    Optional<CpeMapping> findGenericMappingByPackageName(@Param("packageName") String packageName);
    
    /**
     * Recherche tous les mappings pour un package donné
     */
    List<CpeMapping> findByPackageNameContainingIgnoreCaseAndIsActiveTrue(String packageName);
    
    /**
     * Recherche par CPE URI
     */
    List<CpeMapping> findByCpeUriAndIsActiveTrue(String cpeUri);
    
    /**
     * Recherche par vendor
     */
    List<CpeMapping> findByVendorContainingIgnoreCaseAndIsActiveTrue(String vendor);
    
    /**
     * Recherche par product
     */
    List<CpeMapping> findByProductContainingIgnoreCaseAndIsActiveTrue(String product);
    
    /**
     * Récupère tous les mappings actifs triés par usage
     */
    @Query("SELECT c FROM CpeMapping c WHERE c.isActive = true ORDER BY c.usageCount DESC, c.createdAt DESC")
    List<CpeMapping> findAllActiveOrderByUsage();
    
    /**
     * Récupère les mappings créés par un utilisateur
     */
    List<CpeMapping> findByCreatedByAndIsActiveTrue(String createdBy);
    
    /**
     * Récupère les mappings non validés
     */
    List<CpeMapping> findByIsValidatedFalseAndIsActiveTrue();
    
    /**
     * Compte le nombre de mappings actifs
     */
    long countByIsActiveTrue();
    
    /**
     * Recherche fuzzy sur nom et version de package
     */
    @Query("SELECT c FROM CpeMapping c WHERE c.isActive = true AND " +
           "(LOWER(c.packageName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.packageVersion) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.vendor) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.product) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<CpeMapping> searchMappings(@Param("searchTerm") String searchTerm);
    
    /**
     * Incrémente le compteur d'utilisation d'un mapping
     */
    @Modifying
    @Transactional
    @Query("UPDATE CpeMapping c SET c.usageCount = c.usageCount + 1 WHERE c.id = :id")
    void incrementUsageCount(@Param("id") Long id);
}
