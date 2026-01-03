package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.TechnologyObsolescence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechnologyObsolescenceRepository extends JpaRepository<TechnologyObsolescence, Long> {
    
    Optional<TechnologyObsolescence> findByTechnologyNameAndVersionPattern(String technologyName, String versionPattern);
    
    List<TechnologyObsolescence> findByTechnologyName(String technologyName);
    
    List<TechnologyObsolescence> findByIsObsolete(Boolean isObsolete);
    
    @Query("SELECT t FROM TechnologyObsolescence t WHERE t.technologyName = :techName AND t.isObsolete = true")
    Optional<TechnologyObsolescence> findObsoleteByTechnology(@Param("techName") String technologyName);
}
