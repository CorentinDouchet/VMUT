package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.ComplianceRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplianceRuleRepository extends JpaRepository<ComplianceRule, Long> {
    
    Optional<ComplianceRule> findByReference(String reference);
    
    List<ComplianceRule> findByFramework(String framework);
    
    List<ComplianceRule> findByLevel(String level);
    
    List<ComplianceRule> findByStatus(String status);
    
    @Query("SELECT COUNT(c) FROM ComplianceRule c WHERE c.status = 'compliant'")
    Long countCompliant();
    
    @Query("SELECT COUNT(c) FROM ComplianceRule c WHERE c.status = 'non-compliant'")
    Long countNonCompliant();
    
    @Query("SELECT COUNT(c) FROM ComplianceRule c WHERE c.status = 'partial'")
    Long countPartial();
    
    @Query("SELECT COUNT(c) FROM ComplianceRule c WHERE c.status = 'not-checked'")
    Long countNotChecked();
}
