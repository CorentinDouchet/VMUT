package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.Cve;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.CveRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenVASImportService {

    private static final Logger logger = LoggerFactory.getLogger(OpenVASImportService.class);

    @Autowired
    private XmlReportParser xmlReportParser;

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private CveRepository cveRepository;

    @org.springframework.beans.factory.annotation.Value("${app.uploads.xml.dir}")
    private String uploadsXmlDir;

    @Transactional
    public Map<String, Object> importOpenVASXml(MultipartFile file, String relatedAssetName) {
        Map<String, Object> response = new HashMap<>();
       
        try {
            // Validate file
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "Le fichier est vide");
                return response;
            }

            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".xml")) {
                response.put("success", false);
                response.put("message", "Le fichier doit être au format XML");
                return response;
            }

            // Use original filename as scan name (remove .xml extension)
            String scanName = originalFilename.replaceAll("\\.xml$", "");
            String filename = originalFilename;

            // Save file to uploads/xml directory
            Path uploadPath = Paths.get(uploadsXmlDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(filename);
            
            // ✅ CORRECTION : Utiliser transferTo() au lieu de Files.copy(file.getInputStream(), ...)
            file.transferTo(filePath);

            logger.info("📁 Fichier XML sauvegardé: {}", filePath);

            // Parse XML file
            File xmlFile = filePath.toFile();
            List<XmlReportParser.XmlCveData> cveList = xmlReportParser.parseXmlReport(xmlFile);

            logger.info("📊 {} CVEs trouvées dans le fichier XML", cveList.size());

            // Delete existing data for this scan before importing
            vulnerabilityResultRepository.deleteByScanName(scanName);
            assetRepository.deleteByScanName(scanName);
            logger.info("🗑️ Anciennes données supprimées pour le scan: {}", scanName);

            // Create or get asset with related asset name
            Asset asset = createAssetForScan(scanName, originalFilename, relatedAssetName);

            // Import vulnerabilities
            int imported = 0;
            int enriched = 0;

            for (XmlReportParser.XmlCveData xmlCve : cveList) {
                VulnerabilityResult vulnResult = new VulnerabilityResult();
               
                vulnResult.setCveId(xmlCve.getCveId());
                vulnResult.setAssetId(asset.getId());
                vulnResult.setScanName(scanName);
                vulnResult.setPackageName(xmlCve.getAffectedPackage() != null ? xmlCve.getAffectedPackage() : "Unknown");
                vulnResult.setPackageVersion("");
                vulnResult.setCveDescription(xmlCve.getDescription());
               
                // Set CVSS data from XML
                if (xmlCve.getSeverity() != null) {
                    try {
                        BigDecimal score = new BigDecimal(xmlCve.getSeverity());
                        vulnResult.setBaseScore(score);
                        vulnResult.setBaseSeverity(calculateSeverityLevel(score));
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid severity score for {}: {}", xmlCve.getCveId(), xmlCve.getSeverity());
                    }
                }
               
                vulnResult.setVectorString(xmlCve.getCvssVector());
                vulnResult.setCvssVersion("3.1"); // Default version for OpenVAS
               
                // Set EPSS data
                if (xmlCve.getEpssScore() != null) {
                    try {
                        vulnResult.setEpssScore(new BigDecimal(xmlCve.getEpssScore()));
                    } catch (NumberFormatException e) {
                        logger.warn("Invalid EPSS score for {}: {}", xmlCve.getCveId(), xmlCve.getEpssScore());
                    }
                }
               
                // Enrich from CVE database
                Cve cve = cveRepository.findByCveId(xmlCve.getCveId()).orElse(null);
                if (cve != null) {
                    enriched++;
                   
                    if (cve.getPublished() != null) {
                        vulnResult.setPublishedDate(cve.getPublished());
                    }
                    if (cve.getLastModified() != null) {
                        vulnResult.setLastModifiedDate(cve.getLastModified());
                    }
                   
                    // Override with database data if XML data is missing
                    if (vulnResult.getBaseScore() == null && cve.getBaseScore() != null) {
                        vulnResult.setBaseScore(cve.getBaseScore());
                        vulnResult.setBaseSeverity(calculateSeverityLevel(cve.getBaseScore()));
                    }
                    if (vulnResult.getVectorString() == null && cve.getVectorString() != null) {
                        vulnResult.setVectorString(cve.getVectorString());
                    }
                }
               
                vulnResult.setLastScanDate(LocalDateTime.now());
                vulnResult.setValidityStatus("Non traité");
                vulnResult.setRssiStatus("Non traité");
               
                vulnerabilityResultRepository.save(vulnResult);
                imported++;
            }

            response.put("success", true);
            response.put("message", "Import réussi");
            response.put("scanName", scanName);
            response.put("filename", filename);
            response.put("assetId", asset.getId());
            response.put("totalCves", cveList.size());
            response.put("imported", imported);
            response.put("enriched", enriched);

            logger.info("✅ Import OpenVAS terminé: {} CVEs importées, {} enrichies", imported, enriched);

            return response;

        } catch (IOException e) {
            logger.error("❌ Erreur lors de la sauvegarde du fichier XML", e);
            response.put("success", false);
            response.put("message", "Erreur lors de la sauvegarde du fichier: " + e.getMessage());
            return response;
        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'import du fichier XML OpenVAS", e);
            response.put("success", false);
            response.put("message", "Erreur lors de l'import: " + e.getMessage());
            return response;
        }
    }

    private Asset createAssetForScan(String scanName, String originalFilename, String relatedAssetName) {
        Asset asset = new Asset();
        asset.setName(scanName); // Nom unique pour l'asset
        asset.setType("OPENVAS"); // Type OpenVAS
        asset.setScanName(scanName);
        asset.setRelatedAssetName(relatedAssetName); // Lier au nom de l'asset
        asset.setPackageName("OpenVAS XML Report");
        asset.setPackageVersion("N/A");
        asset.setOsName("OpenVAS");
        asset.setOsVersion("OpenVAS");
        asset.setHostname(originalFilename);
        asset.setScanDate(LocalDateTime.now());
        asset.setCreatedAt(LocalDateTime.now());
       
        Map<String, Object> rawData = new HashMap<>();
        rawData.put("sourceFile", originalFilename);
        rawData.put("scanType", "OpenVAS");
        rawData.put("importDate", LocalDateTime.now().toString());
        asset.setRawData(rawData);
       
        return assetRepository.save(asset);
    }

    private String calculateSeverityLevel(BigDecimal score) {
        if (score == null) return "NONE";
        double scoreValue = score.doubleValue();
        if (scoreValue >= 9.0) return "CRITICAL";
        if (scoreValue >= 7.0) return "HIGH";
        if (scoreValue >= 4.0) return "MEDIUM";
        if (scoreValue > 0.0) return "LOW";
        return "NONE";
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void deleteOpenVASScan(String scanName) {
        try {
            // Delete vulnerabilities
            vulnerabilityResultRepository.deleteByScanName(scanName);
           
            // Delete assets
            assetRepository.deleteByScanName(scanName);
           
            // Delete XML file
            try {
                Path xmlPath = Paths.get(uploadsXmlDir, scanName + ".xml");
                Files.deleteIfExists(xmlPath);
            } catch (IOException e) {
                logger.warn("⚠️ Impossible de supprimer le fichier XML: {}", e.getMessage());
            }
           
            logger.info("🗑️ Scan OpenVAS supprimé: {}", scanName);
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la suppression du scan: {}", scanName, e);
            // Ne pas propager l'exception pour ne pas bloquer l'import
        }
    }

    @Transactional
    public Map<String, Object> deleteScan(String scanName) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            logger.info("🗑️ Suppression du scan OpenVAS: {}", scanName);
            
            // Delete vulnerabilities
            vulnerabilityResultRepository.deleteByScanName(scanName);
            logger.info("✅ Vulnérabilités supprimées pour le scan: {}", scanName);
            
            // Delete assets
            assetRepository.deleteByScanName(scanName);
            logger.info("✅ Assets supprimés pour le scan: {}", scanName);
            
            // Delete XML file
            try {
                Path xmlPath = Paths.get(uploadsXmlDir, scanName + ".xml");
                Files.deleteIfExists(xmlPath);
                logger.info("✅ Fichier XML supprimé: {}", scanName);
            } catch (IOException e) {
                logger.warn("⚠️ Impossible de supprimer le fichier XML: {}", e.getMessage());
            }
            
            result.put("success", true);
            result.put("message", "Scan OpenVAS supprimé avec succès");
            result.put("scanName", scanName);
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la suppression du scan {}: {}", scanName, e.getMessage());
            result.put("success", false);
            result.put("message", "Erreur lors de la suppression: " + e.getMessage());
        }
        
        return result;
    }
}