package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.JustificationCopyRequest;
import com.mbda.mbdhackuity.dto.JustificationDTO;
import com.mbda.mbdhackuity.dto.JustificationSuggestion;
import com.mbda.mbdhackuity.service.JustificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller pour la réutilisation des justifications entre actifs
 * Implémentation de STB_REQ_0150
 */
@RestController
@RequestMapping("/api/justifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Justifications", description = "Réutilisation des justifications entre actifs")
public class JustificationController {

    private final JustificationService justificationService;

    @GetMapping("/asset/{assetId}")
    @Operation(summary = "Récupérer les justifications d'un actif",
               description = "Retourne toutes les justifications (commentsAnalyst) des vulnérabilités d'un actif")
    public ResponseEntity<List<JustificationDTO>> getJustificationsByAsset(@PathVariable Long assetId) {
        log.info("GET /api/justifications/asset/{}", assetId);
        List<JustificationDTO> justifications = justificationService.getJustificationsByAsset(assetId);
        return ResponseEntity.ok(justifications);
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher des justifications par CVE",
               description = "Recherche toutes les justifications existantes pour un CVE donné")
    public ResponseEntity<List<JustificationDTO>> searchJustificationsByCve(@RequestParam String cveId) {
        log.info("GET /api/justifications/search?cveId={}", cveId);
        List<JustificationDTO> justifications = justificationService.findJustificationsByCve(cveId);
        return ResponseEntity.ok(justifications);
    }

    @PostMapping("/copy")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    @Operation(summary = "Copier des justifications entre actifs",
               description = "Copie les justifications sélectionnées d'un actif source vers un actif cible")
    public ResponseEntity<Map<String, Object>> copyJustifications(@RequestBody JustificationCopyRequest request) {
        log.info("POST /api/justifications/copy - {} CVE de l'actif {} vers l'actif {}", 
                request.getCveIds().size(), request.getSourceAssetId(), request.getTargetAssetId());
        
        Map<String, Object> result = justificationService.copyJustifications(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/suggest/{assetId}")
    @Operation(summary = "Suggérer des justifications réutilisables",
               description = "Retourne les CVE de l'actif qui ont des justifications disponibles sur d'autres actifs")
    public ResponseEntity<List<JustificationSuggestion>> suggestJustifications(@PathVariable Long assetId) {
        log.info("GET /api/justifications/suggest/{}", assetId);
        List<JustificationSuggestion> suggestions = justificationService.suggestReusableJustifications(assetId);
        return ResponseEntity.ok(suggestions);
    }
}
