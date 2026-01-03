package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.ScanImport;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.ScanImportRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.mbda.mbdhackuity.service.AuditLogService;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ScanImportService {

    private static final Logger log = LoggerFactory.getLogger(ScanImportService.class);

    @Value("${app.uploads.scans.dir}")
    private String uploadDir;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private ScanImportRepository scanImportRepository;

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @Autowired
    private CveMatchingService cveMatchingService;

    // Parser un fichier de scan
    public ScanMetadata parseScanFile(File file) throws IOException {
        log.info("📖 Lecture du fichier de scan...");
        
        ScanMetadata metadata = new ScanMetadata();
        List<PackageInfo> packages = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                
                if (trimmed.startsWith("OS_NAME:")) {
                    metadata.setOsName(trimmed.substring(8).trim());
                } else if (trimmed.startsWith("OS_VERSION:")) {
                    metadata.setOsVersion(trimmed.substring(11).trim());
                } else if (trimmed.startsWith("HOSTNAME:")) {
                    metadata.setHostname(trimmed.substring(9).trim());
                } else if (trimmed.startsWith("DEB_PACKAGE:")) {
                    String packageData = trimmed.substring(12).trim();
                    String[] parts = packageData.split("\\|");
                    if (parts.length >= 2) {
                        PackageInfo pkg = new PackageInfo();
                        pkg.setName(parts[0].trim());
                        pkg.setVersion(parts[1].trim());
                        packages.add(pkg);
                    }
                }
            }
        }

        metadata.setPackages(packages);
        return metadata;
    }

    // Générer un nom de scan
    private String generateScanName(String hostname) {
        String scanName = (hostname != null ? hostname : "unknown") + "_scan";
        log.info("📝 Nom du scan: {}", scanName);
        return scanName;
    }

    // Import d'un scan
    @Transactional
    public Map<String, Object> importScan(MultipartFile file, String customScanName, boolean runMatching, String relatedAssetName) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Sauvegarder le fichier
            File tempFile = saveUploadedFile(file);
            
            // Parser
            ScanMetadata metadata = parseScanFile(tempFile);
            String scanName = customScanName != null ? customScanName : generateScanName(metadata.getHostname());

            log.info("📊 Trouvé : {} packages", metadata.getPackages().size());
            log.info("🖥️ OS: {} {}", metadata.getOsName(), metadata.getOsVersion());
            log.info("🏷️ Hostname: {}", metadata.getHostname());
            log.info("📝 Nom du scan: {}", scanName);
            log.info("🔗 Asset lié: {}", relatedAssetName);

            // Supprimer l'ancien scan
            log.info("🗑️ Suppression de l'ancien scan si existant...");
            assetRepository.deleteByScanName(scanName);

            // Importer les packages
            log.info("📦 Import des packages...");
            int imported = 0;

            for (PackageInfo pkg : metadata.getPackages()) {
                try {
                    Asset asset = new Asset();
                    
                    // Générer un nom unique pour le package
                    String assetName = scanName + "_" + pkg.getName();
                    asset.setName(assetName);
                    asset.setType("CYBERWATCH");
                    
                    asset.setScanName(scanName);
                    asset.setRelatedAssetName(relatedAssetName); // Lier au nom de l'asset
                    asset.setPackageName(pkg.getName());
                    asset.setPackageVersion(pkg.getVersion());
                    asset.setOsName(metadata.getOsName());
                    asset.setOsVersion(metadata.getOsVersion());
                    asset.setHostname(metadata.getHostname());
                    
                    Map<String, Object> rawData = new HashMap<>();
                    rawData.put("name", pkg.getName());
                    rawData.put("version", pkg.getVersion());
                    asset.setRawData(rawData);

                    assetRepository.save(asset);
                    imported++;

                    if (imported % 100 == 0) {
                        log.info("   ⏳ {}/{} packages importés...", imported, metadata.getPackages().size());
                    }
                } catch (Exception e) {
                    log.error("   ⚠️ Erreur pour {}: {}", pkg.getName(), e.getMessage());
                }
            }

            log.info("✅ Import terminé : {} packages pour le scan \"{}\"", imported, scanName);

            // Log audit de l'import
            auditLogService.logScanImport(
                "admin", // TODO: récupérer l'utilisateur authentifié
                file.getOriginalFilename(),
                imported,
                true
            );

            result.put("success", true);
            result.put("scanName", scanName);
            result.put("imported", imported);
            result.put("total", metadata.getPackages().size());
            result.put("fileName", file.getOriginalFilename());

            // Lancer le matching
            if (runMatching && imported > 0) {
                log.info("\n🔍 Lancement du matching CVE...");
                log.info("📦 {} packages importés dans le scan '{}'", imported, scanName);
                try {
                    Map<String, Object> matchingResult = cveMatchingService.runCVEMatching(scanName);
                    result.put("matching", matchingResult);
                    log.info("✅ Matching terminé: {} CVE trouvées", matchingResult.get("totalCVEs"));
                } catch (Exception e) {
                    log.error("❌ Erreur lors du matching CVE: {}", e.getMessage(), e);
                    Map<String, Object> errorMatching = new HashMap<>();
                    errorMatching.put("totalCVEs", 0);
                    errorMatching.put("error", e.getMessage());
                    result.put("matching", errorMatching);
                }
            } else if (runMatching && imported == 0) {
                log.warn("⚠️ Matching demandé mais aucun package importé");
            }

            // Nettoyer le fichier temporaire
            tempFile.delete();

            return result;

        } catch (Exception e) {
            log.error("❌ Erreur: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }

    // Import de plusieurs scans
    @Transactional
    public Map<String, Object> importMultipleScans(List<MultipartFile> files, boolean runMatching, String relatedAssetName) {
        log.info("\n🚀 Import de {} scan(s)...\n", files.size());

        List<Map<String, Object>> results = new ArrayList<>();
        int totalImported = 0;
        int totalCVEs = 0;
        int successCount = 0;

        for (MultipartFile file : files) {
            Map<String, Object> result = importScan(file, null, runMatching, relatedAssetName);
            results.add(result);
            
            if ((Boolean) result.get("success")) {
                successCount++;
                totalImported += (Integer) result.get("imported");
                
                if (runMatching && result.containsKey("matching")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> matching = (Map<String, Object>) result.get("matching");
                    totalCVEs += (Integer) matching.get("totalCVEs");
                }
            }
            log.info("---\n");
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("message", String.format("Import terminé: %d/%d réussis", successCount, files.size()));
        summary.put("totalImported", totalImported);
        if (runMatching) {
            summary.put("totalCVEs", totalCVEs);
        }
        summary.put("results", results);

        log.info("\n🎉 Import terminé !");
        log.info("   Scans réussis: {}/{}", successCount, files.size());
        log.info("   Packages importés: {}", totalImported);
        if (runMatching) {
            log.info("   CVE trouvées: {}", totalCVEs);
        }

        return summary;
    }

    // Matching manuel
    public Map<String, Object> runCVEMatching(String scanName) {
        return cveMatchingService.runCVEMatching(scanName);
    }

    // Historique des imports
    public List<Map<String, Object>> getImportHistory(int limit) {
        // TODO: Implémenter avec ScanImportRepository
        return new ArrayList<>();
    }

    // Logs d'un import
    public List<Map<String, Object>> getImportLogs(Long id) {
        // TODO: Implémenter avec ScanImportLogRepository
        return new ArrayList<>();
    }

    // Stats des imports
    public Map<String, Object> getImportStats() {
        // TODO: Implémenter
        return new HashMap<>();
    }

    // Sauvegarder le fichier uploadé
    private File saveUploadedFile(MultipartFile file) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename = System.currentTimeMillis() + "-" + file.getOriginalFilename();
        Path filePath = uploadPath.resolve(filename);
        file.transferTo(filePath.toFile());

        return filePath.toFile();
    }

    // Classes internes
    public static class ScanMetadata {
        private String osName;
        private String osVersion;
        private String hostname;
        private List<PackageInfo> packages;

        // Getters et setters
        public String getOsName() { return osName; }
        public void setOsName(String osName) { this.osName = osName; }
        public String getOsVersion() { return osVersion; }
        public void setOsVersion(String osVersion) { this.osVersion = osVersion; }
        public String getHostname() { return hostname; }
        public void setHostname(String hostname) { this.hostname = hostname; }
        public List<PackageInfo> getPackages() { return packages; }
        public void setPackages(List<PackageInfo> packages) { this.packages = packages; }
    }

    public static class PackageInfo {
        private String name;
        private String version;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
    }

    @Transactional
    public Map<String, Object> deleteScan(String scanName) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            log.info("🗑️ Suppression du scan: {}", scanName);
            
            // Delete all vulnerabilities for this scan
            vulnerabilityResultRepository.deleteByScanName(scanName);
            log.info("✅ Vulnérabilités supprimées pour le scan: {}", scanName);
            
            // Delete the scan import record by scanName
            Optional<ScanImport> scanImport = scanImportRepository.findByScanName(scanName);
            if (scanImport.isPresent()) {
                scanImportRepository.delete(scanImport.get());
                log.info("✅ Enregistrement du scan supprimé: {}", scanName);
            }
            
            result.put("success", true);
            result.put("message", "Scan supprimé avec succès");
            result.put("scanName", scanName);
            
        } catch (Exception e) {
            log.error("❌ Erreur lors de la suppression du scan {}: {}", scanName, e.getMessage());
            result.put("success", false);
            result.put("message", "Erreur lors de la suppression: " + e.getMessage());
        }
        
        return result;
    }
}