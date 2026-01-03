package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.CpeIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CpeIndexRepository extends JpaRepository<CpeIndex, Long> {
    
    List<CpeIndex> findByCveId(String cveId);
    
    // Recherche par variantes de produit
    @Query("SELECT c FROM CpeIndex c WHERE c.isVulnerable = true " +
           "AND c.product IN :productVariants")
    List<CpeIndex> findByProductVariants(@Param("productVariants") List<String> productVariants);
    
    // Recherche par vendor et product (pour mapping manuel CPE)
    @Query("SELECT c FROM CpeIndex c WHERE c.isVulnerable = true " +
           "AND LOWER(c.vendor) = LOWER(:vendor) " +
           "AND LOWER(c.product) = LOWER(:product)")
    List<CpeIndex> findByVendorAndProduct(@Param("vendor") String vendor, @Param("product") String product);
    
    // Stats
    @Query("SELECT COUNT(DISTINCT c.product) FROM CpeIndex c WHERE c.isVulnerable = true")
    Long countDistinctProducts();
    
    @Query("SELECT COUNT(DISTINCT c.vendor) FROM CpeIndex c WHERE c.isVulnerable = true")
    Long countDistinctVendors();
}