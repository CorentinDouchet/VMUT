package com.mbda.mbdhackuity.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mbda.mbdhackuity.entity.*;
import com.mbda.mbdhackuity.repository.*;
import com.mbda.mbdhackuity.util.ProductVariantGenerator;
import com.mbda.mbdhackuity.util.VersionComparator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CveMatchingService {
    
    private final AssetRepository assetRepository;
    private final CpeIndexRepository cpeIndexRepository;
    private final CveRepository cveRepository;
    private final VulnerabilityResultRepository vulnerabilityResultRepository;
    private final CpeMappingRepository cpeMappingRepository;
    private final ProductVariantGenerator variantGenerator;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final VersionComparator versionComparator;
    private final ObsolescenceDetectionService obsolescenceDetectionService;
    
    /**
     * Lance le matching CVE pour un scan complet
     */
    @Transactional
    public MatchingResult matchCVEsForScan(String scanName, boolean verbose) {
        log.info("🔍 Starting CVE matching for scan: {}", scanName);
        log.info("=".repeat(70));
        
        // Supprimer les résultats existants
        log.info("🗑️ Cleaning existing vulnerability results for scan: {}", scanName);
        int deletedCount = (int) vulnerabilityResultRepository.findByScanName(scanName).size();
        vulnerabilityResultRepository.deleteByScanName(scanName);
        log.info("🗑️ Deleted {} existing vulnerability results", deletedCount);
        
        // Récupérer tous les assets du scan
        List<Asset> assets = assetRepository.findByScanName(scanName);
        log.info("\n📦 {} packages to analyze", assets.size());
        
        int totalMatches = 0;
        int packagesWithVulns = 0;
        long startTime = System.currentTimeMillis();
        
        for (int i = 0; i < assets.size(); i++) {
            Asset asset = assets.get(i);
            
            // Log de progression
            if (i > 0 && i % 50 == 0) {
                long elapsed = (System.currentTimeMillis() - startTime) / 1000;
                double rate = elapsed > 0 ? (double) i / elapsed : 0;
                log.info("⏳ {}/{} packages ({} CVE, {:.1f} pkg/s)", 
                         i, assets.size(), totalMatches, rate);
            }
            
            // PRIORITÉ 1: Vérifier d'abord les mappings manuels CPE
            Optional<CpeMapping> manualMapping = cpeMappingRepository
                .findByPackageNameAndPackageVersionAndIsActiveTrue(
                    asset.getPackageName(), 
                    asset.getPackageVersion()
                );
            
            if (manualMapping.isEmpty()) {
                // Essayer un mapping générique (sans version spécifique)
                manualMapping = cpeMappingRepository
                    .findGenericMappingByPackageName(asset.getPackageName());
            }
            
            List<CpeIndex> cveCandidates;
            
            if (manualMapping.isPresent()) {
                // Utiliser le CPE URI manuel
                CpeMapping mapping = manualMapping.get();
                String cpeUri = mapping.getCpeUri();
                
                if (verbose && i < 10) {
                    log.info("\n🎯 {} v{} - MANUAL MAPPING", asset.getPackageName(), asset.getPackageVersion());
                    log.info("   CPE: {} (confidence: {})", cpeUri, mapping.getConfidenceLevel());
                }
                
                // Extraire vendor et product du CPE URI
                String[] cpeParts = cpeUri.split(":");
                if (cpeParts.length >= 5) {
                    String vendor = cpeParts[3];
                    String product = cpeParts[4];
                    cveCandidates = cpeIndexRepository.findByVendorAndProduct(vendor, product);
                    
                    // Incrémenter le compteur d'utilisation
                    cpeMappingRepository.incrementUsageCount(mapping.getId());
                    
                    if (verbose && i < 10) {
                        log.info("   → {} CVE candidates from manual mapping", cveCandidates.size());
                    }
                } else {
                    log.warn("⚠️ Invalid CPE URI format: {}", cpeUri);
                    cveCandidates = List.of();
                }
            } else {
                // PRIORITÉ 2: Utiliser la corrélation automatique
                List<String> variants = variantGenerator.generateVariants(asset.getPackageName());
                
                if (verbose && i < 10) {
                    log.info("\n🔍 {} v{}", asset.getPackageName(), asset.getPackageVersion());
                    log.info("   Variants: {}", variants.subList(0, Math.min(5, variants.size())));
                }
                
                cveCandidates = cpeIndexRepository.findByProductVariants(variants);
            }
            
            if (verbose && !cveCandidates.isEmpty() && i < 10) {
                log.info("   → {} CVE candidates", cveCandidates.size());
            }
            
            int assetVulns = 0;
            
            // Évaluer chaque CVE candidate
            for (CpeIndex cpe : cveCandidates) {
                MatchEvaluation match = evaluateMatch(asset, cpe);
                
                if (match.isMatched()) {
                    // Récupérer les infos complètes de la CVE
                    Optional<Cve> cveOpt = cveRepository.findByCveId(cpe.getCveId());  // Corrigé: cveRepository en minuscule
                    if (cveOpt.isPresent()) {
                        Cve cve = cveOpt.get();
                        saveVulnerability(asset, cve, cpe, match, scanName);
                        totalMatches++;
                        assetVulns++;
                        
                        if (verbose && assetVulns <= 3 && i < 10) {
                            log.info("   ✅ {} - Score: {} ({}) Confidence: {:.2f}", 
                                    cpe.getCveId(), cve.getBaseScore(), 
                                    cve.getBaseSeverity(), match.getConfidence());
                        }
                    }
                }
            }
            
            if (assetVulns > 0) {
                packagesWithVulns++;
            }
        }
        
        long elapsed = (System.currentTimeMillis() - startTime) / 1000;
        
        log.info("\n{}", "=".repeat(70));
        log.info("🎉 MATCHING COMPLETED in {}s", elapsed);
        log.info("   • Vulnerable packages: {}/{}", packagesWithVulns, assets.size());
        log.info("   • Total vulnerabilities: {}", totalMatches);
        log.info("{}\n", "=".repeat(70));
        
        // Afficher les stats par sévérité
        logSeverityStats(scanName);
        
        return MatchingResult.builder()
            .scanName(scanName)
            .totalPackages(assets.size())
            .vulnerablePackages(packagesWithVulns)
            .totalVulnerabilities(totalMatches)
            .elapsedSeconds(elapsed)
            .build();
    }
    
    /**
     * Méthode wrapper pour compatibilité avec ScanImportService
     * Retourne un Map<String, Object> au lieu de MatchingResult
     */
    public Map<String, Object> runCVEMatching(String scanName) {
        log.info("🔍 Starting CVE matching for scan: {}", scanName);
        
        // Vérifier qu'il y a des CVE dans la base
        long totalCvesInDb = cveRepository.count();
        log.info("📊 Total CVE in database: {}", totalCvesInDb);
        
        if (totalCvesInDb == 0) {
            log.warn("⚠️ No CVE found in database! Please import CVE data first.");
            Map<String, Object> response = new HashMap<>();
            response.put("scanName", scanName);
            response.put("totalPackages", 0);
            response.put("vulnerablePackages", 0);
            response.put("totalCVEs", 0);
            response.put("elapsedSeconds", 0L);
            response.put("error", "No CVE in database");
            return response;
        }
        
        // Vérifier qu'il y a des CPE dans l'index
        long totalCpeInDb = cpeIndexRepository.count();
        log.info("📊 Total CPE in index: {}", totalCpeInDb);
        
        if (totalCpeInDb == 0) {
            log.warn("⚠️ No CPE found in index! CVE data might not be properly indexed.");
        }
        
        MatchingResult result = matchCVEsForScan(scanName, false);
        
        Map<String, Object> response = new HashMap<>();
        response.put("scanName", result.getScanName());
        response.put("totalPackages", result.getTotalPackages());
        response.put("vulnerablePackages", result.getVulnerablePackages());
        response.put("totalCVEs", result.getTotalVulnerabilities());
        response.put("elapsedSeconds", result.getElapsedSeconds());
        
        log.info("✅ Matching complete: {} vulnerabilities found in {} packages", 
                 result.getTotalVulnerabilities(), result.getVulnerablePackages());
        
        return response;
    }
    
    /**
     * Évalue si un asset matche avec une CVE
     * Mode Cyberwatch : matcher toutes les CVE mentionnant le package, même sans version exacte
     */
    private MatchEvaluation evaluateMatch(Asset asset, CpeIndex cpe) {
        boolean matched = false;
        double confidence = 0;
        String matchType = "";
        
        // Match par version exacte (priorité 1)
        if (cpe.getVersion() != null && 
            !cpe.getVersion().equals("*") && 
            !cpe.getVersion().equals("-")) {
            
            if (versionComparator.compare(asset.getPackageVersion(), cpe.getVersion()) == 0) {
                matched = true;
                confidence = 1.0;
                matchType = "exact_version";
                return new MatchEvaluation(matched, confidence, matchType);
            }
        }
        
        // Match par range de versions (priorité 2)
        if (hasVersionRange(cpe)) {
            if (versionComparator.isInRange(
                asset.getPackageVersion(),
                cpe.getVersionStartIncluding(),
                cpe.getVersionStartExcluding(),
                cpe.getVersionEndIncluding(),
                cpe.getVersionEndExcluding()
            )) {
                matched = true;
                confidence = 0.85;
                matchType = "version_range";
                return new MatchEvaluation(matched, confidence, matchType);
            }
        }
        
        // Match wildcard (toutes versions) - priorité 3
        if (isWildcardVersion(cpe) && !hasVersionRange(cpe)) {
            matched = true;
            confidence = 0.6;
            matchType = "all_versions";
            return new MatchEvaluation(matched, confidence, matchType);
        }
        
        // Mode Cyberwatch: Matcher même sans version exacte (priorité 4)
        // Si le produit correspond, on accepte même si la version ne match pas parfaitement
        // Cela permet de détecter toutes les CVE potentielles comme Cyberwatch
        matched = true;
        confidence = 0.5;
        matchType = "product_match_only";
        
        return new MatchEvaluation(matched, confidence, matchType);
    }
    
    /**
     * Sauvegarde une vulnérabilité matchée
     */
    private void saveVulnerability(Asset asset, Cve cve, CpeIndex cpe, 
                                   MatchEvaluation match, String scanName) {
        // Extraire CWE
        String cwe = extractCWEs(cve.getRawData());
        
        // Vérifier exploits
        ExploitInfo exploitInfo = checkExploitAvailability(cve.getRawData());
        
        // Extraire EPSS
        BigDecimal epssScore = extractEpssScore(cve.getRawData());
        
        // Threat Intelligence (CISA KEV, CERT-FR)
        ThreatIntelligence threatIntel = extractThreatIntelligence(cve.getRawData());
        
        // Déterminer si c'est une vulnérabilité prioritaire
        boolean isPriority = determinePriority(cve.getBaseScore(), exploitInfo.isAvailable(), threatIntel.cisaKevDate());
        
        VulnerabilityResult vuln = new VulnerabilityResult();
        vuln.setCveId(cve.getCveId());
        vuln.setAssetId(asset.getId());
        vuln.setScanName(scanName);
        vuln.setPackageName(asset.getPackageName());
        vuln.setPackageVersion(asset.getPackageVersion());
        vuln.setCveDescription(cve.getDescription() != null ? 
            cve.getDescription().substring(0, Math.min(500, cve.getDescription().length())) : null);
        vuln.setCwe(cwe);
        vuln.setCvssVersion(cve.getCvssVersion());
        vuln.setBaseScore(cve.getBaseScore());
        vuln.setBaseSeverity(cve.getBaseSeverity());
        vuln.setVectorString(cve.getVectorString());
        vuln.setAffectedTechnologies(String.format("%s (%s)", cpe.getProduct(), cpe.getCpeString()));
        vuln.setExploitPocAvailable(exploitInfo.isAvailable());
        vuln.setExploitReferences(exploitInfo.getReferences());
        vuln.setExploitLevel(exploitInfo.getLevel());
        vuln.setEpssScore(epssScore);
        vuln.setIsPriority(isPriority);
        vuln.setCisaKevDate(threatIntel.cisaKevDate());
        vuln.setCertFrAleDate(threatIntel.certFrAleDate());
        vuln.setLastScanDate(LocalDateTime.now());
        vuln.setPublishedDate(cve.getPublished());
        vuln.setLastModifiedDate(cve.getLastModified());
        vuln.setMatchConfidence(java.math.BigDecimal.valueOf(match.getConfidence()));
        vuln.setMatchType(match.getMatchType());
        vuln.setValidityStatus(null); // Null par défaut pour afficher "Oui" dans le frontend
        vuln.setCommentsAnalyst(null); // Initialize as null for JSONB
        vuln.setCommentsValidator(null); // Initialize as null for JSONB
        // vuln.setAddedToScanDate(LocalDateTime.now()); // Method does not exist
        
        // Détection automatique d'obsolescence
        ObsolescenceDetectionService.ObsolescenceMatch obsolescenceMatch = 
                obsolescenceDetectionService.checkObsolescence(asset.getPackageName(), asset.getPackageVersion());
        
        if (obsolescenceMatch.detected()) {
            vuln.setObsolescenceDetected(true);
            vuln.setObsolescenceInfo(obsolescenceDetectionService.formatObsolescenceInfo(obsolescenceMatch));
            log.debug("🚫 Obsolescence flagged for {} {}: {}", 
                    asset.getPackageName(), asset.getPackageVersion(), obsolescenceMatch.technologyName());
        } else {
            vuln.setObsolescenceDetected(false);
            vuln.setObsolescenceInfo(null);
        }
        
        // Handle cveReferences - convert TEXT to JSON if needed
        String cveRefsText = cve.getCveReferences();
        if (cveRefsText != null && !cveRefsText.trim().isEmpty()) {
            // If it's already JSON, use as is; otherwise make it null
            if (cveRefsText.trim().startsWith("{") || cveRefsText.trim().startsWith("[")) {
                vuln.setCveReferences(cveRefsText);
            } else {
                vuln.setCveReferences(null); // Set to null if not valid JSON
            }
        } else {
            vuln.setCveReferences(null);
        }
        
        // Vérifier si la vulnérabilité existe déjà pour éviter les doublons
        if (vulnerabilityResultRepository.existsByCveIdAndAssetId(cve.getCveId(), asset.getId())) {
            log.debug("Duplicate vulnerability skipped: {} for asset {}", cve.getCveId(), asset.getId());
            return;
        }
        
        try {
            vulnerabilityResultRepository.save(vuln);
            log.debug("Saved vulnerability: {} for asset {}", cve.getCveId(), asset.getId());
        } catch (Exception e) {
            log.error("Failed to save vulnerability {} for asset {}: {}", cve.getCveId(), asset.getId(), e.getMessage());
            throw e;
        }
    }
    
    /**
     * Extrait les CWE du raw data
     */
    @SuppressWarnings("unchecked")
    private String extractCWEs(Object rawDataObj) {
        Map<String, Object> rawData = null;
        if (rawDataObj instanceof String) {
            try {
                rawData = objectMapper.readValue((String) rawDataObj, Map.class);
            } catch (Exception e) {
                return "NVD-CWE-noinfo";
            }
        } else if (rawDataObj instanceof Map) {
            rawData = (Map<String, Object>) rawDataObj;
        }
        
        if (rawData == null || !rawData.containsKey("weaknesses")) {
            return "NVD-CWE-noinfo";
        }
        
        try {
            List<Map<String, Object>> weaknesses = (List<Map<String, Object>>) rawData.get("weaknesses");
            StringBuilder cwes = new StringBuilder();
            
            for (Map<String, Object> weakness : weaknesses) {
                List<Map<String, Object>> descriptions = (List<Map<String, Object>>) weakness.get("description");
                if (descriptions != null) {
                    for (Map<String, Object> desc : descriptions) {
                        String value = (String) desc.get("value");
                        if (value != null && value.startsWith("CWE-")) {
                            if (cwes.length() > 0) cwes.append(", ");
                            cwes.append(value);
                        }
                    }
                }
            }
            
            return cwes.length() > 0 ? cwes.toString() : "NVD-CWE-noinfo";
        } catch (Exception e) {
            return "NVD-CWE-noinfo";
        }
    }
    
    /**
     * Vérifie la disponibilité d'exploits et détermine leur niveau
     */
    @SuppressWarnings("unchecked")
    private ExploitInfo checkExploitAvailability(Object rawDataObj) {
        Map<String, Object> rawData = null;
        if (rawDataObj instanceof String) {
            try {
                rawData = objectMapper.readValue((String) rawDataObj, Map.class);
            } catch (Exception e) {
                return new ExploitInfo(false, "", "Non disponible");
            }
        } else if (rawDataObj instanceof Map) {
            rawData = (Map<String, Object>) rawDataObj;
        }
        
        if (rawData == null || !rawData.containsKey("references")) {
            return new ExploitInfo(false, "", "Non disponible");
        }
        
        try {
            List<Map<String, Object>> references = (List<Map<String, Object>>) rawData.get("references");
            StringBuilder exploits = new StringBuilder();
            boolean hasExploit = false;
            boolean hasFunctionalExploit = false;
            boolean hasPoC = false;
            
            for (Map<String, Object> ref : references) {
                List<String> tags = (List<String>) ref.get("tags");
                if (tags != null) {
                    if (tags.contains("Exploit")) {
                        hasExploit = true;
                        hasFunctionalExploit = true;
                        if (exploits.length() > 0) exploits.append(" | ");
                        exploits.append(ref.get("url"));
                    } else if (tags.contains("Proof-of-Concept")) {
                        hasExploit = true;
                        hasPoC = true;
                        if (exploits.length() > 0) exploits.append(" | ");
                        exploits.append(ref.get("url"));
                    }
                }
            }
            
            String level = "Non disponible";
            if (hasFunctionalExploit) {
                level = "Fonctionnel";
            } else if (hasPoC) {
                level = "Démonstration";
            }
            
            return new ExploitInfo(hasExploit, exploits.toString(), level);
        } catch (Exception e) {
            return new ExploitInfo(false, "", "Non disponible");
        }
    }
    
    /**
     * Extrait le score EPSS du raw data (si disponible)
     */
    @SuppressWarnings("unchecked")
    private BigDecimal extractEpssScore(Object rawDataObj) {
        Map<String, Object> rawData = null;
        if (rawDataObj instanceof String) {
            try {
                rawData = objectMapper.readValue((String) rawDataObj, Map.class);
            } catch (Exception e) {
                return null;
            }
        } else if (rawDataObj instanceof Map) {
            rawData = (Map<String, Object>) rawDataObj;
        }
        
        if (rawData == null || !rawData.containsKey("metrics")) {
            return null;
        }
        
        try {
            Map<String, Object> metrics = (Map<String, Object>) rawData.get("metrics");
            if (metrics != null && metrics.containsKey("epss")) {
                Object epssObj = metrics.get("epss");
                if (epssObj instanceof Number) {
                    double epss = ((Number) epssObj).doubleValue() * 100; // Convertir en %
                    return BigDecimal.valueOf(epss).setScale(2, java.math.RoundingMode.HALF_UP);
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Détecte si la CVE est dans CISA KEV ou CERT-FR ALE
     */
    @SuppressWarnings("unchecked")
    private ThreatIntelligence extractThreatIntelligence(Object rawDataObj) {
        Map<String, Object> rawData = null;
        if (rawDataObj instanceof String) {
            try {
                rawData = objectMapper.readValue((String) rawDataObj, Map.class);
            } catch (Exception e) {
                return new ThreatIntelligence(null, null);
            }
        } else if (rawDataObj instanceof Map) {
            rawData = (Map<String, Object>) rawDataObj;
        }
        
        if (rawData == null || !rawData.containsKey("references")) {
            return new ThreatIntelligence(null, null);
        }
        
        try {
            List<Map<String, Object>> references = (List<Map<String, Object>>) rawData.get("references");
            LocalDateTime cisaKev = null;
            LocalDateTime certFr = null;
            
            for (Map<String, Object> ref : references) {
                String url = (String) ref.get("url");
                if (url != null) {
                    if (url.contains("cisa.gov/known-exploited-vulnerabilities")) {
                        // Extraire la date si disponible dans les métadonnées
                        // Pour l'instant, utiliser la date de publication de la CVE
                        cisaKev = LocalDateTime.now();
                    } else if (url.contains("cert.ssi.gouv.fr") || url.contains("cert-fr")) {
                        certFr = LocalDateTime.now();
                    }
                }
            }
            
            return new ThreatIntelligence(cisaKev, certFr);
        } catch (Exception e) {
            return new ThreatIntelligence(null, null);
        }
    }
    
    /**
     * Détermine si une vulnérabilité est prioritaire
     * Critères: score >= 7.0 OU exploit disponible OU présente dans CISA KEV
     */
    private boolean determinePriority(BigDecimal baseScore, boolean hasExploit, LocalDateTime cisaKevDate) {
        if (cisaKevDate != null) return true;
        if (hasExploit) return true;
        if (baseScore != null && baseScore.compareTo(BigDecimal.valueOf(7.0)) >= 0) return true;
        return false;
    }
    
    /**
     * Vérifie si le CPE a un range de versions
     */
    private boolean hasVersionRange(CpeIndex cpe) {
        return cpe.getVersionStartIncluding() != null ||
               cpe.getVersionStartExcluding() != null ||
               cpe.getVersionEndIncluding() != null ||
               cpe.getVersionEndExcluding() != null;
    }
    
    /**
     * Vérifie si c'est une version wildcard
     */
    private boolean isWildcardVersion(CpeIndex cpe) {
        return cpe.getVersion() == null || 
               cpe.getVersion().equals("*") || 
               cpe.getVersion().equals("-");
    }
    
    /**
    /**
     * Log les stats par sévérité
     */
    private void logSeverityStats(String scanName) {
        // TODO: Implement severity stats query. Method countBySeverityForScan does not exist.
        log.info("📊 By severity: (not implemented)");
    }
    
    /**
     * Classe interne pour les infos d'exploit
     */
    private record ExploitInfo(boolean available, String references, String level) {
        public boolean isAvailable() { return available; }
        public String getReferences() { return references; }
        public String getLevel() { return level; }
    }
    
    /**
     * Classe interne pour les infos de threat intelligence
     */
    private record ThreatIntelligence(LocalDateTime cisaKevDate, LocalDateTime certFrAleDate) {
    }
}