package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.AssetDTO;
import com.mbda.mbdhackuity.dto.AssetDuplicationRequest;
import com.mbda.mbdhackuity.dto.AssetDuplicationResult;
import com.mbda.mbdhackuity.dto.AssetHierarchyDTO;
import com.mbda.mbdhackuity.dto.PageResponse;
import com.mbda.mbdhackuity.dto.ScanSummaryDTO;
import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assets")
@Tag(name = "Assets", description = "Gestion des assets (machines/packages scannés)")
public class AssetController {

    @Autowired
    private AssetService assetService;

    // GET /api/assets - Liste de tous les assets
    @GetMapping
    public ResponseEntity<List<Asset>> getAllAssets() {
        return ResponseEntity.ok(assetService.getAllAssets());
    }

    // GET /api/assets/name/{name} - Récupérer un asset par nom (AVANT /{id} pour éviter les conflits)
    @GetMapping("/name/{name}")
    public ResponseEntity<Asset> getAssetByName(@PathVariable String name) {
        return assetService.getAssetByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/assets/name/{name}/scans - Liste des scans Cyberwatch par nom d'asset
    @GetMapping("/name/{name}/scans")
    public ResponseEntity<List<ScanSummaryDTO>> getAssetScansByName(@PathVariable String name) {
        return ResponseEntity.ok(assetService.getScanSummariesByAssetName(name));
    }

    // GET /api/assets/name/{name}/scans/openvas - Liste des scans OpenVAS par nom d'asset
    @GetMapping("/name/{name}/scans/openvas")
    public ResponseEntity<List<ScanSummaryDTO>> getAssetOpenVASScansByName(@PathVariable String name) {
        return ResponseEntity.ok(assetService.getOpenVASScanSummariesByAssetName(name));
    }

    // GET /api/assets/name/{name}/scans/pivot - Liste des scans Pivot par nom d'asset
    @GetMapping("/name/{name}/scans/pivot")
    public ResponseEntity<List<ScanSummaryDTO>> getAssetPivotScansByName(@PathVariable String name) {
        return ResponseEntity.ok(assetService.getPivotScanSummariesByAssetName(name));
    }

    // GET /api/assets/scans - Liste de tous les scans Cyberwatch
    @GetMapping("/scans")
    public ResponseEntity<List<ScanSummaryDTO>> getScans() {
        return ResponseEntity.ok(assetService.getScanSummaries());
    }

    // GET /api/assets/scans/openvas - Liste de tous les scans OpenVAS
    @GetMapping("/scans/openvas")
    public ResponseEntity<List<ScanSummaryDTO>> getOpenVASScans() {
        return ResponseEntity.ok(assetService.getOpenVASScanSummaries());
    }

    // GET /api/assets/stats - Statistiques globales des scans
    @GetMapping("/stats")
    public ResponseEntity<?> getGlobalStats() {
        return ResponseEntity.ok(assetService.getGlobalStats());
    }

    // GET /api/assets/{id} - Récupérer un asset spécifique par ID (APRÈS les routes spécifiques)
    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable Long id) {
        return assetService.getAssetById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/assets/{id}/scans - Liste des scans Cyberwatch pour un asset
    @GetMapping("/{id}/scans")
    public ResponseEntity<List<ScanSummaryDTO>> getAssetScans(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getScanSummariesByAssetId(id));
    }

    // GET /api/assets/{id}/scans/openvas - Liste des scans OpenVAS pour un asset
    @GetMapping("/{id}/scans/openvas")
    public ResponseEntity<List<ScanSummaryDTO>> getAssetOpenVASScans(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getOpenVASScanSummariesByAssetId(id));
    }

    // POST /api/assets - Créer un asset manuel
    @PostMapping
    public ResponseEntity<Asset> createAsset(@RequestBody Asset asset) {
        asset.setType("MANUAL");
        return ResponseEntity.ok(assetService.createAsset(asset));
    }

    // DELETE /api/assets/{id} - Supprimer un asset
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/assets/scans/{scanName}/stats - Statistiques d'un scan
    @GetMapping("/scans/{scanName}/stats")
    public ResponseEntity<?> getScanStats(@PathVariable String scanName) {
        return ResponseEntity.ok(assetService.getScanStats(scanName));
    }

    // GET /api/assets/name/{name}/vulnerabilities/summary - Vulnérabilités consolidées pour un asset
    @GetMapping("/name/{name}/vulnerabilities/summary")
    public ResponseEntity<?> getConsolidatedVulnerabilities(@PathVariable String name) {
        List<?> vulnerabilities = assetService.getConsolidatedVulnerabilitiesByAssetName(name);
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalVulnerabilities", vulnerabilities.size());
        summary.put("lastUpdated", java.time.LocalDateTime.now());
        return ResponseEntity.ok(summary);
    }

    // POST /api/assets/name/{name}/vulnerabilities/refresh - Relancer le matching des vulnérabilités
    @PostMapping("/name/{name}/vulnerabilities/refresh")
    public ResponseEntity<?> refreshConsolidatedVulnerabilities(@PathVariable String name) {
        return ResponseEntity.ok(assetService.refreshVulnerabilitiesForAsset(name));
    }
    
    // POST /api/assets/{id}/duplicate - Dupliquer un asset (STB_REQ_0140)
    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    @Operation(summary = "Dupliquer un asset avec ses données", 
               description = "Crée une copie d'un asset avec options pour copier vulnérabilités, justifications et pièces jointes")
    public ResponseEntity<AssetDuplicationResult> duplicateAsset(
            @PathVariable Long id, 
            @RequestBody AssetDuplicationRequest request) {
        return ResponseEntity.ok(assetService.duplicateAsset(id, request));
    }
    
    // GET /api/assets/{id}/hierarchy - Récupérer la hiérarchie d'un asset (STB_REQ_0130)
    @GetMapping("/{id}/hierarchy")
    @Operation(summary = "Récupérer la hiérarchie d'un asset", 
               description = "Retourne l'asset avec ses sous-assets en structure arborescente")
    public ResponseEntity<AssetHierarchyDTO> getAssetHierarchy(@PathVariable Long id) {
        return ResponseEntity.ok(assetService.getAssetHierarchy(id));
    }
    
    // GET /api/assets/hierarchies - Récupérer toutes les hiérarchies (STB_REQ_0130)
    @GetMapping("/hierarchies")
    @Operation(summary = "Récupérer toutes les hiérarchies d'assets", 
               description = "Retourne tous les assets racines avec leurs sous-assets")
    public ResponseEntity<List<AssetHierarchyDTO>> getAllHierarchies() {
        return ResponseEntity.ok(assetService.getAllAssetHierarchies());
    }
    
    // POST /api/assets/{id}/sub-assets/{subAssetId} - Assigner un sous-asset (STB_REQ_0130)
    @PostMapping("/{id}/sub-assets/{subAssetId}")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    @Operation(summary = "Assigner un asset comme sous-asset d'un autre", 
               description = "Crée une relation parent-enfant entre deux assets")
    public ResponseEntity<Void> assignSubAsset(
            @PathVariable Long id, 
            @PathVariable Long subAssetId) {
        assetService.assignSubAsset(id, subAssetId);
        return ResponseEntity.ok().build();
    }
    
    // DELETE /api/assets/{id}/sub-assets/{subAssetId} - Retirer un sous-asset (STB_REQ_0130)
    @DeleteMapping("/{id}/sub-assets/{subAssetId}")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    @Operation(summary = "Retirer un sous-asset", 
               description = "Supprime la relation parent-enfant entre deux assets")
    public ResponseEntity<Void> removeSubAsset(
            @PathVariable Long id, 
            @PathVariable Long subAssetId) {
        assetService.removeSubAsset(id, subAssetId);
        return ResponseEntity.ok().build();
    }
} 
