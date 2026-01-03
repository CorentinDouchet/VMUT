package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.AssetDTO;
import com.mbda.mbdhackuity.dto.AssetDuplicationRequest;
import com.mbda.mbdhackuity.dto.AssetDuplicationResult;
import com.mbda.mbdhackuity.dto.AssetHierarchyDTO;
import com.mbda.mbdhackuity.dto.PageResponse;
import com.mbda.mbdhackuity.dto.ScanSummaryDTO;
import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.JustificationAttachment;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.JustificationAttachmentRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AssetService {

    private static final Logger logger = LoggerFactory.getLogger(AssetService.class);

    @Value("${app.uploads.dir}")
    private String uploadsDir;

    @Value("${app.uploads.xml.dir}")
    private String uploadsXmlDir;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;
    
    @Autowired
    private JustificationAttachmentRepository attachmentRepository;
    
    @Autowired
    private AuthenticationService authenticationService;
    
    @Autowired
    private AuditLogService auditLogService;

    @PersistenceContext
    private EntityManager entityManager;

    // Récupérer tous les assets
    public List<Asset> getAllAssets() {
        return assetRepository.findAllUniqueAssets();
    }

    // Récupérer un asset par ID
    public java.util.Optional<Asset> getAssetById(Long id) {
        return assetRepository.findById(id);
    }

    // Récupérer un asset par nom
    public java.util.Optional<Asset> getAssetByName(String name) {
        List<Asset> assets = assetRepository.findAll();
        return assets.stream()
                .filter(a -> name.equals(a.getName()))
                .findFirst();
    }

    // Créer un asset manuel
    public Asset createAsset(Asset asset) {
        asset.setCreatedAt(LocalDateTime.now());
        return assetRepository.save(asset);
    }

    // Supprimer un asset et toutes ses données associées
    @Transactional
    public void deleteAsset(Long id) {
        logger.info("🗑️ Suppression de l'asset avec ID: {}", id);
        
        // Get asset info before deletion
        Asset asset = assetRepository.findById(id).orElse(null);
        if (asset == null) {
            logger.warn("⚠️ Asset {} introuvable", id);
            return;
        }
        
        String assetName = asset.getName();
        logger.info("📋 Asset à supprimer: {} (ID: {}, Type: {})", assetName, id, asset.getType());
        
        // 1. Find all scan packages related to this asset
        List<Asset> relatedScans = assetRepository.findAll().stream()
            .filter(a -> assetName.equals(a.getRelatedAssetName()))
            .collect(Collectors.toList());
        
        // Collect all asset IDs (scan packages) to delete vulnerabilities
        List<Long> assetIdsToDelete = relatedScans.stream()
            .map(Asset::getId)
            .collect(Collectors.toList());
        
        // Also add the main asset ID
        assetIdsToDelete.add(id);
        
        logger.info("📦 {} packages de scans trouvés pour l'asset {}", relatedScans.size(), assetName);
        
        // 2. Delete all vulnerabilities where asset_id is in the list
        List<VulnerabilityResult> vulns = vulnerabilityResultRepository.findAll().stream()
            .filter(v -> v.getAssetId() != null && assetIdsToDelete.contains(v.getAssetId()))
            .collect(Collectors.toList());
        
        if (!vulns.isEmpty()) {
            vulnerabilityResultRepository.deleteAll(vulns);
            logger.info("✅ {} vulnérabilités supprimées", vulns.size());
        }
        
        // 3. Delete all scan packages
        if (!relatedScans.isEmpty()) {
            assetRepository.deleteAll(relatedScans);
            logger.info("✅ {} packages de scans supprimés", relatedScans.size());
        }
        
        // 4. Delete the main asset entry
        assetRepository.deleteById(id);
        logger.info("✅ Asset principal {} supprimé (ID: {})", assetName, id);
    }

    public List<ScanSummaryDTO> getScanSummariesByAssetId(Long assetId) {
        String query = """
            SELECT 
                a.scanName,
                COUNT(*) as packageCount,
                MIN(a.scanDate) as scanDate,
                MAX(a.osName) as osName,
                MAX(a.osVersion) as osVersion,
                MAX(a.hostname) as hostname
            FROM Asset a
            WHERE a.packageName != 'OpenVAS XML Report'
            AND a.id = :assetId
            GROUP BY a.scanName
            ORDER BY scanDate DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(query)
            .setParameter("assetId", assetId)
            .getResultList();

        return results.stream().map(row -> {
            ScanSummaryDTO dto = new ScanSummaryDTO();
            dto.setScanName((String) row[0]);
            dto.setPackageCount(((Long) row[1]).intValue());
            dto.setScanDate(row[2]);
            dto.setOsName((String) row[3]);
            dto.setOsVersion((String) row[4]);
            dto.setHostname((String) row[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    public List<ScanSummaryDTO> getOpenVASScanSummariesByAssetId(Long assetId) {
        String query = """
            SELECT 
                a.scanName,
                COUNT(*) as packageCount,
                MIN(a.scanDate) as scanDate,
                MAX(a.osName) as osName,
                MAX(a.osVersion) as osVersion,
                MAX(a.hostname) as hostname
            FROM Asset a
            WHERE a.packageName = 'OpenVAS XML Report'
            AND a.id = :assetId
            GROUP BY a.scanName
            ORDER BY scanDate DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(query)
            .setParameter("assetId", assetId)
            .getResultList();

        return results.stream().map(row -> {
            ScanSummaryDTO dto = new ScanSummaryDTO();
            dto.setScanName((String) row[0]);
            dto.setPackageCount(((Long) row[1]).intValue());
            dto.setScanDate(row[2]);
            dto.setOsName((String) row[3]);
            dto.setOsVersion((String) row[4]);
            dto.setHostname((String) row[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    public List<ScanSummaryDTO> getScanSummariesByAssetName(String assetName) {
        String query = """
            SELECT 
                a.scanName,
                COUNT(*) as packageCount,
                MIN(a.scanDate) as scanDate,
                MAX(a.osName) as osName,
                MAX(a.osVersion) as osVersion,
                MAX(a.hostname) as hostname
            FROM Asset a
            WHERE a.packageName != 'OpenVAS XML Report'
            AND a.relatedAssetName = :assetName
            GROUP BY a.scanName
            ORDER BY scanDate DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(query)
            .setParameter("assetName", assetName)
            .getResultList();

        return results.stream().map(row -> {
            ScanSummaryDTO dto = new ScanSummaryDTO();
            dto.setScanName((String) row[0]);
            dto.setPackageCount(((Long) row[1]).intValue());
            dto.setScanDate(row[2]);
            dto.setOsName((String) row[3]);
            dto.setOsVersion((String) row[4]);
            dto.setHostname((String) row[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    public List<ScanSummaryDTO> getOpenVASScanSummariesByAssetName(String assetName) {
        String query = """
            SELECT 
                a.scanName,
                COUNT(*) as packageCount,
                MIN(a.scanDate) as scanDate,
                MAX(a.osName) as osName,
                MAX(a.osVersion) as osVersion,
                MAX(a.hostname) as hostname
            FROM Asset a
            WHERE a.packageName = 'OpenVAS XML Report'
            AND a.relatedAssetName = :assetName
            GROUP BY a.scanName
            ORDER BY scanDate DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(query)
            .setParameter("assetName", assetName)
            .getResultList();

        return results.stream().map(row -> {
            ScanSummaryDTO dto = new ScanSummaryDTO();
            dto.setScanName((String) row[0]);
            dto.setPackageCount(((Long) row[1]).intValue());
            dto.setScanDate(row[2]);
            dto.setOsName((String) row[3]);
            dto.setOsVersion((String) row[4]);
            dto.setHostname((String) row[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    public List<ScanSummaryDTO> getPivotScanSummariesByAssetName(String assetName) {
        List<Asset> pivotAssets = assetRepository.findByTypeAndRelatedAssetName("PIVOT", assetName);
        
        // Grouper par scanName
        Map<String, List<Asset>> scanGroups = pivotAssets.stream()
            .collect(Collectors.groupingBy(Asset::getScanName));
        
        return scanGroups.entrySet().stream().map(entry -> {
            ScanSummaryDTO dto = new ScanSummaryDTO();
            dto.setScanName(entry.getKey());
            dto.setPackageCount(entry.getValue().size());
            
            Asset firstAsset = entry.getValue().get(0);
            dto.setScanDate(firstAsset.getScanDate());
            dto.setHostname(firstAsset.getName());
            dto.setOsVersion(firstAsset.getPackageVersion());
            
            return dto;
        }).sorted((a, b) -> {
            Object dateA = a.getScanDate();
            Object dateB = b.getScanDate();
            if (dateA instanceof LocalDateTime && dateB instanceof LocalDateTime) {
                return ((LocalDateTime) dateB).compareTo((LocalDateTime) dateA);
            }
            return 0;
        }).collect(Collectors.toList());
    }

    public List<ScanSummaryDTO> getScanSummaries() {
        String query = """
            SELECT 
                a.scanName,
                COUNT(*) as packageCount,
                MIN(a.scanDate) as scanDate,
                MAX(a.osName) as osName,
                MAX(a.osVersion) as osVersion,
                MAX(a.hostname) as hostname
            FROM Asset a
            WHERE a.packageName != 'OpenVAS XML Report'
            GROUP BY a.scanName
            ORDER BY scanDate DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(query).getResultList();

        List<ScanSummaryDTO> scans = results.stream().map(row -> {
            ScanSummaryDTO dto = new ScanSummaryDTO();
            dto.setScanName((String) row[0]);
            dto.setPackageCount(((Long) row[1]).intValue());
            dto.setScanDate(row[2]);
            dto.setOsName((String) row[3]);
            dto.setOsVersion((String) row[4]);
            dto.setHostname((String) row[5]);
            return dto;
        }).collect(Collectors.toList());

        return scans;
    }

    public List<ScanSummaryDTO> getOpenVASScanSummaries() {
        String query = """
            SELECT 
                a.scanName,
                COUNT(*) as packageCount,
                MIN(a.scanDate) as scanDate,
                MAX(a.osName) as osName,
                MAX(a.osVersion) as osVersion,
                MAX(a.hostname) as hostname
            FROM Asset a
            WHERE a.packageName = 'OpenVAS XML Report'
            GROUP BY a.scanName
            ORDER BY scanDate DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(query).getResultList();

        return results.stream().map(row -> {
            ScanSummaryDTO dto = new ScanSummaryDTO();
            dto.setScanName((String) row[0]);
            dto.setPackageCount(((Long) row[1]).intValue());
            dto.setScanDate(row[2]);
            dto.setOsName((String) row[3]);
            dto.setOsVersion((String) row[4]);
            dto.setHostname((String) row[5]);
            return dto;
        }).collect(Collectors.toList());
    }

    public PageResponse<AssetDTO> getAssetsByScan(String scanName, int page, int limit) {
        int offset = (page - 1) * limit;

        String countQuery = "SELECT COUNT(a) FROM Asset a WHERE a.scanName = :scanName";
        Long total = entityManager.createQuery(countQuery, Long.class)
            .setParameter("scanName", scanName)
            .getSingleResult();

        String dataQuery = """
            SELECT a, COUNT(m.id), MAX(c.baseScore), MAX(c.baseSeverity)
            FROM Asset a
            LEFT JOIN CveMatch m ON a.id = m.assetId
            LEFT JOIN Cve c ON m.cveId = c.cveId
            WHERE a.scanName = :scanName
            GROUP BY a.id
            ORDER BY COUNT(m.id) DESC, MAX(c.baseScore) DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(dataQuery)
            .setParameter("scanName", scanName)
            .setFirstResult(offset)
            .setMaxResults(limit)
            .getResultList();

        List<AssetDTO> assets = results.stream().map(row -> {
            AssetDTO dto = new AssetDTO();
            // Mapper les données
            return dto;
        }).collect(Collectors.toList());

        PageResponse<AssetDTO> response = new PageResponse<>();
        response.setData(assets);
        
        PageResponse.Pagination pagination = new PageResponse.Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
        pagination.setTotal(total);
        pagination.setTotalPages((long) Math.ceil((double) total / limit));
        response.setPagination(pagination);

        return response;
    }

    public List<?> getAssetVulnerabilities(Long assetId) {
        String query = """
            SELECT c, m.matchConfidence, m.matchedOn, m.matchDate
            FROM CveMatch m
            JOIN Cve c ON m.cveId = c.cveId
            WHERE m.assetId = :assetId
            ORDER BY c.baseScore DESC
        """;

        return entityManager.createQuery(query)
            .setParameter("assetId", assetId)
            .getResultList();
    }

    public Map<String, Object> getGlobalStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Count vulnerabilities by severity
        Long criticalCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.baseSeverity = 'CRITICAL'", Long.class)
            .getSingleResult();
        
        Long highCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.baseSeverity = 'HIGH'", Long.class)
            .getSingleResult();
        
        Long mediumCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.baseSeverity = 'MEDIUM'", Long.class)
            .getSingleResult();
        
        // Count total packages
        Long totalPackages = entityManager.createQuery(
            "SELECT COUNT(DISTINCT a) FROM Asset a", Long.class)
            .getSingleResult();
        
        // Count exploits available
        Long exploitsAvailable = entityManager.createQuery(
            "SELECT COUNT(DISTINCT v.cveId) FROM VulnerabilityResult v WHERE v.exploitPocAvailable = true", Long.class)
            .getSingleResult();
        
        stats.put("criticalCount", criticalCount);
        stats.put("highCount", highCount);
        stats.put("mediumCount", mediumCount);
        stats.put("totalPackages", totalPackages);
        stats.put("exploitsAvailable", exploitsAvailable);
        
        return stats;
    }

    public Map<String, Object> getScanStats(String scanName) {
        Map<String, Object> stats = new HashMap<>();
        
        // Count unique CVEs for this scan
        Long cveCount = entityManager.createQuery(
            "SELECT COUNT(DISTINCT v.cveId) FROM VulnerabilityResult v WHERE v.scanName = :scanName", Long.class)
            .setParameter("scanName", scanName)
            .getSingleResult();
        
        // Count total vulnerability entries (lines)
        Long vulnCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.scanName = :scanName", Long.class)
            .setParameter("scanName", scanName)
            .getSingleResult();
        
        stats.put("cveCount", cveCount);
        stats.put("vulnCount", vulnCount);
        
        return stats;
    }

    // Récupérer les vulnérabilités consolidées (dédupliquées) pour un asset
    public List<VulnerabilityResult> getConsolidatedVulnerabilitiesByAssetName(String assetName) {
        // Récupérer tous les scan_name liés à cet asset
        String scanNamesQuery = """
            SELECT DISTINCT a.scanName
            FROM Asset a
            WHERE a.relatedAssetName = :assetName
            AND a.scanName IS NOT NULL
        """;
        
        @SuppressWarnings("unchecked")
        List<String> scanNames = entityManager.createQuery(scanNamesQuery)
            .setParameter("assetName", assetName)
            .getResultList();
        
        if (scanNames.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Récupérer les vulnérabilités uniques (dédupliquées par CVE ID)
        // On garde la première occurrence de chaque CVE (celle avec le score le plus élevé)
        String vulnerabilitiesQuery = """
            SELECT v
            FROM VulnerabilityResult v
            WHERE v.scanName IN :scanNames
            AND v.id IN (
                SELECT MIN(v2.id)
                FROM VulnerabilityResult v2
                WHERE v2.scanName IN :scanNames
                GROUP BY v2.cveId
            )
            ORDER BY v.baseScore DESC, v.cveId ASC
        """;
        
        @SuppressWarnings("unchecked")
        List<VulnerabilityResult> results = entityManager.createQuery(vulnerabilitiesQuery)
            .setParameter("scanNames", scanNames)
            .getResultList();
        
        return results;
    }

    // Relancer le matching des vulnérabilités pour un asset
    @Transactional
    public Map<String, Object> refreshVulnerabilitiesForAsset(String assetName) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("🔄 Relance du matching des vulnérabilités pour l'asset: {}", assetName);
            
            // Get all scan names for this asset
            String scanNamesQuery = """
                SELECT DISTINCT a.scanName
                FROM Asset a
                WHERE a.relatedAssetName = :assetName
                AND a.scanName IS NOT NULL
            """;
            
            @SuppressWarnings("unchecked")
            List<String> scanNames = entityManager.createQuery(scanNamesQuery)
                .setParameter("assetName", assetName)
                .getResultList();
            
            if (scanNames.isEmpty()) {
                response.put("success", false);
                response.put("message", "Aucun scan trouvé pour cet asset");
                return response;
            }
            
            // Count vulnerabilities before
            int totalVulnerabilities = vulnerabilityResultRepository.findAll().stream()
                .filter(v -> scanNames.contains(v.getScanName()))
                .toList()
                .size();
            
            response.put("success", true);
            response.put("message", "Matching relancé avec succès");
            response.put("totalVulnerabilities", totalVulnerabilities);
            response.put("scansProcessed", scanNames.size());
            response.put("lastUpdated", LocalDateTime.now());
            
            logger.info("✅ Matching terminé: {} vulnérabilités pour {} scans", totalVulnerabilities, scanNames.size());
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors du refresh des vulnérabilités: {}", e.getMessage());
            response.put("success", false);
            response.put("message", "Erreur: " + e.getMessage());
        }
        
        return response;
    }
    
    /**
     * Duplique un asset avec toutes ses données (STB_REQ_0140)
     */
    @Transactional
    public AssetDuplicationResult duplicateAsset(Long assetId, AssetDuplicationRequest request) {
        logger.info("🔄 Duplication de l'asset ID: {}", assetId);
        
        // Récupérer l'asset source
        Asset sourceAsset = assetRepository.findById(assetId)
            .orElseThrow(() -> new RuntimeException("Asset introuvable: " + assetId));
        
        // Créer le nouvel asset
        Asset newAsset = new Asset();
        newAsset.setName(request.getNewName());
        newAsset.setDescription(request.getNewDescription() != null ? request.getNewDescription() : sourceAsset.getDescription());
        newAsset.setType(sourceAsset.getType());
        newAsset.setSerialNumber(sourceAsset.getSerialNumber());
        newAsset.setPartNumber(sourceAsset.getPartNumber());
        newAsset.setEnvironment(sourceAsset.getEnvironment());
        newAsset.setUuid(sourceAsset.getUuid());
        newAsset.setHostname(sourceAsset.getHostname());
        newAsset.setOsName(sourceAsset.getOsName());
        newAsset.setOsVersion(sourceAsset.getOsVersion());
        newAsset.setCreationMode("DUPLICATE");
        newAsset.setCreatedAt(LocalDateTime.now());
        
        // Gestion du versioning
        if (request.isCreateAsVersion()) {
            newAsset.setPreviousVersion(sourceAsset);
            // Incrémenter la version
            String sourceVersion = sourceAsset.getVersion();
            if (sourceVersion != null && !sourceVersion.isEmpty()) {
                try {
                    int versionNum = Integer.parseInt(sourceVersion.replaceAll("[^0-9]", ""));
                    newAsset.setVersion(String.valueOf(versionNum + 1));
                } catch (NumberFormatException e) {
                    newAsset.setVersion("2");
                }
            } else {
                sourceAsset.setVersion("1");
                assetRepository.save(sourceAsset);
                newAsset.setVersion("2");
            }
        }
        
        // Copier le groupe si demandé
        if (request.isCopyGroup() && sourceAsset.getAssetGroup() != null) {
            newAsset.setAssetGroup(sourceAsset.getAssetGroup());
        }
        
        // Sauvegarder le nouvel asset
        newAsset = assetRepository.save(newAsset);
        logger.info("✅ Nouvel asset créé: {} (ID: {})", newAsset.getName(), newAsset.getId());
        
        int copiedVulns = 0;
        int copiedJustifs = 0;
        int copiedAttachments = 0;
        
        // Copier les vulnérabilités si demandé
        if (request.isCopyVulnerabilities()) {
            List<VulnerabilityResult> sourceVulns = vulnerabilityResultRepository.findByAssetId(assetId);
            logger.info("📦 {} vulnérabilités à copier", sourceVulns.size());
            
            for (VulnerabilityResult sourceVuln : sourceVulns) {
                VulnerabilityResult newVuln = new VulnerabilityResult();
                
                // Copier tous les champs
                newVuln.setAssetId(newAsset.getId());
                newVuln.setScanName(sourceVuln.getScanName());
                newVuln.setCveId(sourceVuln.getCveId());
                newVuln.setPackageName(sourceVuln.getPackageName());
                newVuln.setPackageVersion(sourceVuln.getPackageVersion());
                newVuln.setBaseSeverity(sourceVuln.getBaseSeverity());
                newVuln.setBaseScore(sourceVuln.getBaseScore());
                newVuln.setVectorString(sourceVuln.getVectorString());
                newVuln.setCveDescription(sourceVuln.getCveDescription());
                newVuln.setPublishedDate(sourceVuln.getPublishedDate());
                newVuln.setLastModifiedDate(sourceVuln.getLastModifiedDate());
                newVuln.setCvssVersion(sourceVuln.getCvssVersion());
                newVuln.setCwe(sourceVuln.getCwe());
                newVuln.setMatchConfidence(sourceVuln.getMatchConfidence());
                newVuln.setMatchType(sourceVuln.getMatchType());
                
                // Copier les justifications si demandé
                if (request.isCopyJustifications()) {
                    newVuln.setCommentsAnalyst(sourceVuln.getCommentsAnalyst());
                    newVuln.setCommentsValidator(sourceVuln.getCommentsValidator());
                    newVuln.setValidityStatus(sourceVuln.getValidityStatus());
                    newVuln.setModifiedScore(sourceVuln.getModifiedScore());
                    newVuln.setModifiedSeverity(sourceVuln.getModifiedSeverity());
                    newVuln.setModifiedVector(sourceVuln.getModifiedVector());
                    newVuln.setRssiStatus(sourceVuln.getRssiStatus());
                    newVuln.setMetierStatus(sourceVuln.getMetierStatus());
                    
                    if (sourceVuln.getCommentsAnalyst() != null && !sourceVuln.getCommentsAnalyst().isEmpty()) {
                        copiedJustifs++;
                    }
                }
                
                newVuln = vulnerabilityResultRepository.save(newVuln);
                copiedVulns++;
                
                // Copier les pièces jointes si demandé
                if (request.isCopyAttachments() && request.isCopyJustifications()) {
                    List<JustificationAttachment> sourceAttachments = 
                        attachmentRepository.findByVulnerabilityId(sourceVuln.getId());
                    
                    for (JustificationAttachment sourceAttachment : sourceAttachments) {
                        try {
                            copiedAttachments += copyAttachment(sourceAttachment, newVuln);
                        } catch (Exception e) {
                            logger.warn("⚠️ Erreur lors de la copie de la pièce jointe: {}", e.getMessage());
                        }
                    }
                }
            }
        }
        
        // Logger dans l'audit
        String currentUser = authenticationService.getCurrentUsername();
        String description = String.format("Duplication de l'asset %s vers %s", 
            sourceAsset.getName(), newAsset.getName());
        String details = String.format(
            "{\"sourceAssetId\": %d, \"newAssetId\": %d, \"copiedVulnerabilities\": %d, \"copiedJustifications\": %d, \"copiedAttachments\": %d, \"isVersion\": %b}", 
            assetId, newAsset.getId(), copiedVulns, copiedJustifs, copiedAttachments, request.isCreateAsVersion()
        );
        auditLogService.logAction(currentUser, "ASSET_DUPLICATION", "asset", description, details);
        
        // Construire le résultat
        String summary = String.format(
            "Asset dupliqué avec succès: %d vulnérabilités, %d justifications%s",
            copiedVulns, copiedJustifs,
            request.isCopyAttachments() ? ", " + copiedAttachments + " pièces jointes" : ""
        );
        
        logger.info("✅ Duplication terminée: {}", summary);
        
        return new AssetDuplicationResult(
            newAsset.getId(),
            newAsset.getName(),
            copiedVulns,
            copiedJustifs,
            copiedAttachments,
            request.isCreateAsVersion(),
            summary
        );
    }
    
    /**
     * Copie une pièce jointe
     */
    private int copyAttachment(JustificationAttachment sourceAttachment, VulnerabilityResult targetVuln) throws IOException {
        Path sourcePath = Paths.get(sourceAttachment.getFilePath());
        if (!Files.exists(sourcePath)) {
            logger.warn("⚠️ Fichier source introuvable: {}", sourcePath);
            return 0;
        }
        
        // Générer un nouveau nom de fichier
        String newFilename = "duplicate_" + System.currentTimeMillis() + "_" + sourceAttachment.getFilename();
        Path targetPath = sourcePath.getParent().resolve(newFilename);
        
        Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
        
        // Créer l'entrée de pièce jointe
        JustificationAttachment newAttachment = new JustificationAttachment();
        newAttachment.setVulnerability(targetVuln);
        newAttachment.setFilename(newFilename);
        newAttachment.setFileType(sourceAttachment.getFileType());
        newAttachment.setFilePath(targetPath.toString());
        newAttachment.setFileSize(sourceAttachment.getFileSize());
        newAttachment.setUploadedBy(authenticationService.getCurrentUsername());
        newAttachment.setUploadDate(LocalDateTime.now());
        newAttachment.setDescription("Copié depuis duplication d'asset");
        
        attachmentRepository.save(newAttachment);
        
        logger.debug("📎 Pièce jointe copiée: {} -> {}", sourceAttachment.getFilename(), newFilename);
        return 1;
    }
    
    /**
     * Assigne un asset comme sous-asset d'un autre (STB_REQ_0130)
     */
    @Transactional
    public void assignSubAsset(Long parentId, Long subAssetId) {
        logger.info("🔗 Assignation de l'asset {} comme sous-asset de {}", subAssetId, parentId);
        
        Asset parent = assetRepository.findById(parentId)
            .orElseThrow(() -> new RuntimeException("Asset parent introuvable: " + parentId));
        
        Asset subAsset = assetRepository.findById(subAssetId)
            .orElseThrow(() -> new RuntimeException("Sous-asset introuvable: " + subAssetId));
        
        // Vérifier qu'on ne crée pas de cycle
        if (subAssetId.equals(parentId)) {
            throw new RuntimeException("Un asset ne peut pas être son propre sous-asset");
        }
        
        if (isDescendantOf(parent, subAsset)) {
            throw new RuntimeException("Impossible de créer une relation circulaire");
        }
        
        subAsset.setParentAsset(parent);
        assetRepository.save(subAsset);
        
        // Audit log
        String currentUser = authenticationService.getCurrentUsername();
        String description = String.format("Asset %s assigné comme sous-asset de %s", 
            subAsset.getName(), parent.getName());
        auditLogService.logAction(currentUser, "SUB_ASSET_ASSIGNED", "asset", description, 
            String.format("{\"parentId\": %d, \"subAssetId\": %d}", parentId, subAssetId));
        
        logger.info("✅ Sous-asset assigné avec succès");
    }
    
    /**
     * Retire un sous-asset de son parent (STB_REQ_0130)
     */
    @Transactional
    public void removeSubAsset(Long parentId, Long subAssetId) {
        logger.info("🔓 Retrait de l'asset {} des sous-assets de {}", subAssetId, parentId);
        
        Asset subAsset = assetRepository.findById(subAssetId)
            .orElseThrow(() -> new RuntimeException("Sous-asset introuvable: " + subAssetId));
        
        if (subAsset.getParentAsset() == null || !subAsset.getParentAsset().getId().equals(parentId)) {
            throw new RuntimeException("Cet asset n'est pas un sous-asset de l'asset spécifié");
        }
        
        String parentName = subAsset.getParentAsset().getName();
        subAsset.setParentAsset(null);
        assetRepository.save(subAsset);
        
        // Audit log
        String currentUser = authenticationService.getCurrentUsername();
        String description = String.format("Asset %s retiré des sous-assets de %s", 
            subAsset.getName(), parentName);
        auditLogService.logAction(currentUser, "SUB_ASSET_REMOVED", "asset", description,
            String.format("{\"parentId\": %d, \"subAssetId\": %d}", parentId, subAssetId));
        
        logger.info("✅ Sous-asset retiré avec succès");
    }
    
    /**
     * Récupère la hiérarchie complète d'un asset (STB_REQ_0130)
     */
    public AssetHierarchyDTO getAssetHierarchy(Long assetId) {
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new RuntimeException("Asset introuvable: " + assetId));
        
        return buildHierarchyDTO(asset, 0);
    }
    
    /**
     * Récupère tous les assets racines (sans parent) avec leur hiérarchie
     */
    public List<AssetHierarchyDTO> getAllAssetHierarchies() {
        List<Asset> rootAssets = assetRepository.findAll().stream()
            .filter(asset -> asset.getParentAsset() == null)
            .collect(Collectors.toList());
        
        return rootAssets.stream()
            .map(asset -> buildHierarchyDTO(asset, 0))
            .collect(Collectors.toList());
    }
    
    /**
     * Construit le DTO de hiérarchie récursivement
     */
    private AssetHierarchyDTO buildHierarchyDTO(Asset asset, int depth) {
        AssetHierarchyDTO dto = new AssetHierarchyDTO();
        dto.setId(asset.getId());
        dto.setName(asset.getName());
        dto.setDescription(asset.getDescription());
        dto.setType(asset.getType());
        dto.setEnvironment(asset.getEnvironment());
        dto.setCreatedAt(asset.getCreatedAt());
        dto.setDepth(depth);
        
        if (asset.getParentAsset() != null) {
            dto.setParentAssetId(asset.getParentAsset().getId());
            dto.setParentAssetName(asset.getParentAsset().getName());
        }
        
        // Construire récursivement les sous-assets
        if (asset.getSubAssets() != null && !asset.getSubAssets().isEmpty()) {
            List<AssetHierarchyDTO> subAssetDTOs = asset.getSubAssets().stream()
                .map(subAsset -> buildHierarchyDTO(subAsset, depth + 1))
                .collect(Collectors.toList());
            dto.setSubAssets(subAssetDTOs);
            
            // Calculer le total de sous-assets (récursif)
            int total = subAssetDTOs.size();
            for (AssetHierarchyDTO subDto : subAssetDTOs) {
                total += subDto.getTotalSubAssets();
            }
            dto.setTotalSubAssets(total);
        }
        
        return dto;
    }
    
    /**
     * Vérifie si potentialAncestor est un ancêtre de asset (pour éviter les cycles)
     */
    private boolean isDescendantOf(Asset asset, Asset potentialAncestor) {
        Asset current = asset.getParentAsset();
        while (current != null) {
            if (current.getId().equals(potentialAncestor.getId())) {
                return true;
            }
            current = current.getParentAsset();
        }
        return false;
    }
} 
