package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.ScanImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ScanImportRepository extends JpaRepository<ScanImport, Long> {
    Optional<ScanImport> findByScanName(String scanName);
}