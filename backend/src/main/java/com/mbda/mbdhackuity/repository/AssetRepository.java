package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findByScanName(String scanName);
    
    List<Asset> findByType(String type);
    
    List<Asset> findByTypeAndName(String type, String name);
    
    List<Asset> findByTypeAndRelatedAssetName(String type, String relatedAssetName);
    
    @Query("SELECT a FROM Asset a WHERE a.type = 'MANUAL'")
    List<Asset> findAllUniqueAssets();
    
    @Modifying
    @Transactional
    void deleteByScanName(String scanName);
    
    @Query("SELECT COUNT(a) FROM Asset a WHERE a.scanName = :scanName")
    Long countByScanName(String scanName);
}