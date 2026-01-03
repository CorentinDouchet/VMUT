package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.entity.CpeMapping;
import com.mbda.mbdhackuity.service.CpeMappingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller pour la gestion des mappings CPE manuels (STB_REQ_0210)
 */
@RestController
@RequestMapping("/api/cpe-mappings")
public class CpeMappingController {
    
    private static final Logger logger = LoggerFactory.getLogger(CpeMappingController.class);
    
    @Autowired
    private CpeMappingService cpeMappingService;
    
    /**
     * Récupère tous les mappings CPE
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<List<CpeMapping>> getAllMappings() {
        try {
            logger.info("📋 GET /api/cpe-mappings - Récupération de tous les mappings");
            List<CpeMapping> mappings = cpeMappingService.getAllMappings();
            logger.info("✅ {} mappings récupérés", mappings.size());
            return ResponseEntity.ok(mappings);
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la récupération des mappings", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Recherche de mappings
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<List<CpeMapping>> searchMappings(@RequestParam String query) {
        logger.info("🔍 GET /api/cpe-mappings/search?query={}", query);
        List<CpeMapping> mappings = cpeMappingService.searchMappings(query);
        return ResponseEntity.ok(mappings);
    }
    
    /**
     * Récupère un mapping par ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<CpeMapping> getMappingById(@PathVariable Long id) {
        logger.info("📄 GET /api/cpe-mappings/{}", id);
        return cpeMappingService.getMappingById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Crée un nouveau mapping CPE
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<CpeMapping> createMapping(@RequestBody CpeMapping mapping) {
        logger.info("➕ POST /api/cpe-mappings - Création d'un mapping: {} -> {}", 
                    mapping.getPackageName(), mapping.getCpeUri());
        try {
            CpeMapping created = cpeMappingService.createMapping(mapping);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la création du mapping", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Met à jour un mapping existant
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<CpeMapping> updateMapping(
            @PathVariable Long id, 
            @RequestBody CpeMapping mapping) {
        logger.info("📝 PUT /api/cpe-mappings/{}", id);
        try {
            CpeMapping updated = cpeMappingService.updateMapping(id, mapping);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la mise à jour du mapping", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Supprime un mapping
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<Void> deleteMapping(@PathVariable Long id) {
        logger.info("🗑️ DELETE /api/cpe-mappings/{}", id);
        try {
            cpeMappingService.deleteMapping(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la suppression du mapping", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Valide un mapping
     */
    @PostMapping("/{id}/validate")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<CpeMapping> validateMapping(@PathVariable Long id) {
        logger.info("✓ POST /api/cpe-mappings/{}/validate", id);
        try {
            CpeMapping validated = cpeMappingService.validateMapping(id);
            return ResponseEntity.ok(validated);
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la validation du mapping", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Identifie les composants non reconnus (sans CVE)
     */
    @GetMapping("/unmapped")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<Map<String, Object>> findUnmappedPackages() {
        logger.info("🔍 GET /api/cpe-mappings/unmapped - Recherche des composants non reconnus");
        Map<String, Object> result = cpeMappingService.findUnmappedPackages();
        return ResponseEntity.ok(result);
    }
    
    /**
     * Récupère les statistiques des mappings
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<Map<String, Object>> getMappingStatistics() {
        logger.info("📊 GET /api/cpe-mappings/statistics");
        Map<String, Object> stats = cpeMappingService.getMappingStatistics();
        return ResponseEntity.ok(stats);
    }
}
