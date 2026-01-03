package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.CpeMapping;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.CpeMappingRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service pour la gestion des mappings CPE manuels (STB_REQ_0210)
 */
@Service
public class CpeMappingService {
    
    private static final Logger logger = LoggerFactory.getLogger(CpeMappingService.class);
    
    @Autowired
    private CpeMappingRepository cpeMappingRepository;
    
    @Autowired
    private AssetRepository assetRepository;
    
    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;
    
    @Autowired(required = false)
    private AuditLogService auditLogService;
    
    /**
     * Récupère tous les mappings actifs
     */
    public List<CpeMapping> getAllMappings() {
        logger.debug("📋 Récupération de tous les mappings CPE");
        return cpeMappingRepository.findAllActiveOrderByUsage();
    }
    
    /**
     * Récupère un mapping par ID
     */
    public Optional<CpeMapping> getMappingById(Long id) {
        return cpeMappingRepository.findById(id);
    }
    
    /**
     * Recherche de mappings par terme
     */
    public List<CpeMapping> searchMappings(String searchTerm) {
        logger.debug("🔍 Recherche de mappings avec le terme: {}", searchTerm);
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllMappings();
        }
        return cpeMappingRepository.searchMappings(searchTerm.trim());
    }
    
    /**
     * Crée un nouveau mapping CPE
     */
    @Transactional
    public CpeMapping createMapping(CpeMapping mapping) {
        String currentUser = getCurrentUsername();
        logger.info("➕ Création d'un nouveau mapping CPE par {}: {} -> {}", 
                    currentUser, mapping.getPackageName(), mapping.getCpeUri());
        
        // Extraire vendor et product du CPE si non fournis
        if (mapping.getVendor() == null || mapping.getProduct() == null) {
            extractVendorAndProduct(mapping);
        }
        
        mapping.setCreatedBy(currentUser);
        mapping.setCreatedAt(LocalDateTime.now());
        mapping.setUsageCount(0);
        mapping.setIsActive(true);
        
        CpeMapping saved = cpeMappingRepository.save(mapping);
        
        // Journaliser l'action
        if (auditLogService != null) {
            auditLogService.logAction(
                currentUser,
                "CPE_MAPPING_CREATED",
                "cpe_mapping",
                String.format("Mapping créé: %s:%s -> %s", 
                    mapping.getPackageName(), 
                    mapping.getPackageVersion() != null ? mapping.getPackageVersion() : "*", 
                    mapping.getCpeUri()),
                String.format("{\"id\": %d, \"packageName\": \"%s\", \"cpeUri\": \"%s\"}", 
                    saved.getId(), saved.getPackageName(), saved.getCpeUri())
            );
        }
        
        logger.info("✅ Mapping CPE créé avec l'ID: {}", saved.getId());
        return saved;
    }
    
    /**
     * Met à jour un mapping existant
     */
    @Transactional
    public CpeMapping updateMapping(Long id, CpeMapping updatedMapping) {
        String currentUser = getCurrentUsername();
        logger.info("📝 Mise à jour du mapping CPE {} par {}", id, currentUser);
        
        CpeMapping existing = cpeMappingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Mapping introuvable: " + id));
        
        existing.setPackageName(updatedMapping.getPackageName());
        existing.setPackageVersion(updatedMapping.getPackageVersion());
        existing.setCpeUri(updatedMapping.getCpeUri());
        existing.setNotes(updatedMapping.getNotes());
        existing.setConfidenceLevel(updatedMapping.getConfidenceLevel());
        existing.setUpdatedBy(currentUser);
        existing.setUpdatedAt(LocalDateTime.now());
        
        // Extraire vendor et product
        extractVendorAndProduct(existing);
        
        CpeMapping saved = cpeMappingRepository.save(existing);
        
        // Journaliser l'action
        if (auditLogService != null) {
            auditLogService.logAction(
                currentUser,
                "CPE_MAPPING_UPDATED",
                "cpe_mapping",
                String.format("Mapping mis à jour: %s -> %s", existing.getPackageName(), existing.getCpeUri()),
                String.format("{\"id\": %d}", id)
            );
        }
        
        return saved;
    }
    
    /**
     * Supprime (désactive) un mapping
     */
    @Transactional
    public void deleteMapping(Long id) {
        String currentUser = getCurrentUsername();
        logger.info("🗑️ Suppression du mapping CPE {} par {}", id, currentUser);
        
        CpeMapping mapping = cpeMappingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Mapping introuvable: " + id));
        
        mapping.setIsActive(false);
        mapping.setUpdatedBy(currentUser);
        mapping.setUpdatedAt(LocalDateTime.now());
        cpeMappingRepository.save(mapping);
        
        // Journaliser l'action
        if (auditLogService != null) {
            auditLogService.logAction(
                currentUser,
                "CPE_MAPPING_DELETED",
                "cpe_mapping",
                String.format("Mapping supprimé: %s -> %s", mapping.getPackageName(), mapping.getCpeUri()),
                String.format("{\"id\": %d}", id)
            );
        }
    }
    
    /**
     * Valide un mapping
     */
    @Transactional
    public CpeMapping validateMapping(Long id) {
        String currentUser = getCurrentUsername();
        logger.info("✓ Validation du mapping CPE {} par {}", id, currentUser);
        
        CpeMapping mapping = cpeMappingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Mapping introuvable: " + id));
        
        mapping.setIsValidated(true);
        mapping.setUpdatedBy(currentUser);
        mapping.setUpdatedAt(LocalDateTime.now());
        
        CpeMapping saved = cpeMappingRepository.save(mapping);
        
        // Journaliser l'action
        if (auditLogService != null) {
            auditLogService.logAction(
                currentUser,
                "CPE_MAPPING_VALIDATED",
                "cpe_mapping",
                String.format("Mapping validé: %s -> %s", mapping.getPackageName(), mapping.getCpeUri()),
                String.format("{\"id\": %d}", id)
            );
        }
        
        return saved;
    }
    
    /**
     * Recherche un mapping pour un composant donné
     * Priorité: mapping exact > mapping générique
     */
    public Optional<CpeMapping> findMappingForPackage(String packageName, String packageVersion) {
        // Tentative 1: mapping exact avec version
        if (packageVersion != null && !packageVersion.isEmpty()) {
            Optional<CpeMapping> exactMapping = cpeMappingRepository
                .findByPackageNameAndPackageVersionAndIsActiveTrue(packageName, packageVersion);
            if (exactMapping.isPresent()) {
                return exactMapping;
            }
        }
        
        // Tentative 2: mapping générique sans version
        return cpeMappingRepository.findGenericMappingByPackageName(packageName);
    }
    
    /**
     * Incrémente le compteur d'utilisation d'un mapping
     */
    @Transactional
    public void incrementUsageCount(Long mappingId) {
        cpeMappingRepository.findById(mappingId).ifPresent(mapping -> {
            mapping.setUsageCount(mapping.getUsageCount() + 1);
            mapping.setLastUsedAt(LocalDateTime.now());
            cpeMappingRepository.save(mapping);
            logger.debug("📊 Utilisation du mapping {} incrémentée: {}", mappingId, mapping.getUsageCount());
        });
    }
    
    /**
     * Identifie les composants sans CVE (potentiellement non reconnus)
     */
    public Map<String, Object> findUnmappedPackages() {
        logger.info("🔍 Recherche des composants non reconnus");
        
        List<Asset> allAssets = assetRepository.findAll();
        
        Map<String, Set<String>> packagesWithoutCVE = new HashMap<>();
        int totalPackages = 0;
        int packagesWithCVE = 0;
        
        for (Asset asset : allAssets) {
            if (asset.getPackageName() != null && !asset.getPackageName().isEmpty()) {
                totalPackages++;
                String packageKey = asset.getPackageName();
                String version = asset.getPackageVersion();
                
                // Vérifier si le package a des CVE associées
                long cveCount = vulnerabilityResultRepository.countByPackageNameAndAssetId(
                    packageKey, asset.getId());
                
                if (cveCount > 0) {
                    packagesWithCVE++;
                } else {
                    // Ajouter aux packages sans CVE
                    packagesWithoutCVE.putIfAbsent(packageKey, new HashSet<>());
                    if (version != null && !version.isEmpty()) {
                        packagesWithoutCVE.get(packageKey).add(version);
                    }
                }
            }
        }
        
        // Convertir en liste de résultats
        List<Map<String, Object>> unmappedList = packagesWithoutCVE.entrySet().stream()
            .map(entry -> {
                Map<String, Object> item = new HashMap<>();
                item.put("packageName", entry.getKey());
                item.put("versions", new ArrayList<>(entry.getValue()));
                item.put("versionCount", entry.getValue().size());
                
                // Vérifier s'il existe déjà un mapping manuel
                boolean hasMapping = cpeMappingRepository
                    .findByPackageNameContainingIgnoreCaseAndIsActiveTrue(entry.getKey())
                    .size() > 0;
                item.put("hasMapping", hasMapping);
                
                return item;
            })
            .sorted((a, b) -> Integer.compare(
                (Integer) b.get("versionCount"), 
                (Integer) a.get("versionCount")))
            .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("unmappedPackages", unmappedList);
        result.put("totalPackages", totalPackages);
        result.put("packagesWithCVE", packagesWithCVE);
        result.put("packagesWithoutCVE", unmappedList.size());
        result.put("recognitionRate", totalPackages > 0 ? 
            Math.round((packagesWithCVE * 100.0) / totalPackages) : 0);
        
        logger.info("✅ Analyse terminée: {}/{} packages reconnus ({}%)", 
            packagesWithCVE, totalPackages, result.get("recognitionRate"));
        
        return result;
    }
    
    /**
     * Obtient les statistiques des mappings
     */
    public Map<String, Object> getMappingStatistics() {
        long totalMappings = cpeMappingRepository.countByIsActiveTrue();
        List<CpeMapping> allMappings = cpeMappingRepository.findAllActiveOrderByUsage();
        
        long validatedMappings = allMappings.stream()
            .filter(m -> m.getIsValidated() != null && m.getIsValidated())
            .count();
        
        int totalUsage = allMappings.stream()
            .mapToInt(m -> m.getUsageCount() != null ? m.getUsageCount() : 0)
            .sum();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMappings", totalMappings);
        stats.put("validatedMappings", validatedMappings);
        stats.put("pendingValidation", totalMappings - validatedMappings);
        stats.put("totalUsage", totalUsage);
        stats.put("averageUsage", totalMappings > 0 ? totalUsage / (double) totalMappings : 0);
        
        // Distribution par niveau de confiance
        Map<CpeMapping.ConfidenceLevel, Long> confidenceCounts = allMappings.stream()
            .collect(Collectors.groupingBy(
                m -> m.getConfidenceLevel() != null ? m.getConfidenceLevel() : CpeMapping.ConfidenceLevel.HIGH,
                Collectors.counting()
            ));
        
        List<Map<String, Object>> mappingsByConfidence = confidenceCounts.entrySet().stream()
            .map(entry -> {
                Map<String, Object> item = new HashMap<>();
                item.put("confidenceLevel", entry.getKey().toString());
                item.put("count", entry.getValue());
                return item;
            })
            .collect(Collectors.toList());
        stats.put("mappingsByConfidence", mappingsByConfidence);
        
        // Top 5 mappings les plus utilisés
        List<Map<String, Object>> topMappings = allMappings.stream()
            .limit(5)
            .map(m -> {
                Map<String, Object> item = new HashMap<>();
                item.put("packageName", m.getPackageName());
                item.put("packageVersion", m.getPackageVersion());
                item.put("usageCount", m.getUsageCount() != null ? m.getUsageCount() : 0);
                return item;
            })
            .collect(Collectors.toList());
        stats.put("topMappings", topMappings);
        
        return stats;
    }
    
    /**
     * Extrait vendor et product d'un CPE URI
     * Format: cpe:2.3:a:vendor:product:version:...
     */
    private void extractVendorAndProduct(CpeMapping mapping) {
        String cpeUri = mapping.getCpeUri();
        if (cpeUri != null && cpeUri.startsWith("cpe:")) {
            String[] parts = cpeUri.split(":");
            if (parts.length >= 5) {
                mapping.setVendor(parts[3]);
                mapping.setProduct(parts[4]);
            }
        }
    }
    
    /**
     * Récupère le nom de l'utilisateur courant
     */
    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
