package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.CveJustificationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CveJustificationHistoryRepository extends 
    JpaRepository<CveJustificationHistory, Long>, 
    JpaSpecificationExecutor<CveJustificationHistory> {
    Optional<CveJustificationHistory> findByCveId(String cveId);
}