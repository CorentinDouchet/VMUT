package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.service.CveImportService;
import com.mbda.mbdhackuity.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class CveImportController {

    @Autowired
    private CveImportService cveImportService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Import all CVE JSON files from cve_data directory
     * POST /api/admin/import-cve
     */
    @PostMapping("/import-cve")
    public ResponseEntity<Map<String, Object>> importCveData() {
        Map<String, Object> result = cveImportService.importAllCveFiles();
        
        // Log audit de l'import CVE
        int imported = (int) result.getOrDefault("totalImported", 0);
        boolean success = (boolean) result.getOrDefault("success", false);
        
        auditLogService.logDatabaseUpdate(
            "admin", // TODO: récupérer l'utilisateur authentifié
            "Import CVE depuis fichiers JSON",
            imported,
            success
        );
        
        // Automatically build CPE index after import
        if (success) {
            Map<String, Object> indexResult = cveImportService.buildCpeIndex();
            result.put("cpeIndex", indexResult);
            
            // Log audit de la construction d'index CPE
            int cpeEntries = (int) indexResult.getOrDefault("entriesCreated", 0);
            boolean indexSuccess = (boolean) indexResult.getOrDefault("success", false);
            
            auditLogService.logDatabaseUpdate(
                "admin", // TODO: récupérer l'utilisateur authentifié
                "Construction index CPE",
                cpeEntries,
                indexSuccess
            );
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * Build CPE index from existing CVE data
     * POST /api/admin/build-cpe-index
     */
    @PostMapping("/build-cpe-index")
    public ResponseEntity<Map<String, Object>> buildCpeIndex() {
        Map<String, Object> result = cveImportService.buildCpeIndex();
        
        // Log audit de la construction d'index CPE
        int cpeEntries = (int) result.getOrDefault("entriesCreated", 0);
        boolean success = (boolean) result.getOrDefault("success", false);
        
        auditLogService.logDatabaseUpdate(
            "admin", // TODO: récupérer l'utilisateur authentifié
            "Construction index CPE (manuel)",
            cpeEntries,
            success
        );
        
        return ResponseEntity.ok(result);
    }

    /**
     * Get CVE import statistics
     * GET /api/admin/import-stats
     */
    @GetMapping("/import-stats")
    public ResponseEntity<Map<String, Object>> getImportStats() {
        Map<String, Object> stats = cveImportService.getImportStats();
        return ResponseEntity.ok(stats);
    }
}
