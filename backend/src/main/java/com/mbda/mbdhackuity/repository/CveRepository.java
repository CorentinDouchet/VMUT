package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.Cve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CveRepository extends JpaRepository<Cve, Long> {
    Optional<Cve> findByCveId(String cveId);
    
    @Query("SELECT COUNT(c) FROM Cve c")
    Long countAll();
    
    @Query("SELECT COUNT(c) FROM Cve c WHERE c.baseSeverity = :severity")
    Long countBySeverity(String severity);
}