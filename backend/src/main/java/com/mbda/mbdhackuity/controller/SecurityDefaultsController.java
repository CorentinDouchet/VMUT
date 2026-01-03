package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.SecurityDefaultDTO;
import com.mbda.mbdhackuity.service.SecurityDefaultsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security-defaults")
public class SecurityDefaultsController {

    @Autowired
    private SecurityDefaultsService securityDefaultsService;

    /**
     * GET /api/security-defaults
     * Récupère tous les défauts de sécurité
     */
    @GetMapping
    public ResponseEntity<List<SecurityDefaultDTO>> getAllDefaults() {
        List<SecurityDefaultDTO> defaults = securityDefaultsService.getAllSecurityDefaults();
        return ResponseEntity.ok(defaults);
    }

    /**
     * GET /api/security-defaults/{reference}
     * Récupère les détails d'un défaut spécifique
     */
    @GetMapping("/{reference}")
    public ResponseEntity<SecurityDefaultDTO> getDefaultDetails(@PathVariable String reference) {
        SecurityDefaultDTO defaultDTO = securityDefaultsService.getSecurityDefaultDetails(reference);
        if (defaultDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(defaultDTO);
    }

    /**
     * GET /api/security-defaults/search
     * Recherche de défauts avec filtres
     */
    @GetMapping("/search")
    public ResponseEntity<List<SecurityDefaultDTO>> searchDefaults(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String status) {
        List<SecurityDefaultDTO> results = securityDefaultsService.searchDefaults(searchTerm, severity, status);
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/security-defaults/stats
     * Récupère les statistiques des défauts de sécurité
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = securityDefaultsService.getSecurityDefaultsStats();
        return ResponseEntity.ok(stats);
    }
}
