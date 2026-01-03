package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.Cve;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.CveRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PivotScanService {

    private static final Logger logger = LoggerFactory.getLogger(PivotScanService.class);

    @Value("${app.uploads.pivot.dir:uploads/pivot}")
    private String pivotUploadDir;

    @Autowired
    private AssetRepository assetRepository;
    
    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;
    
    @Autowired
    private CveRepository cveRepository;

    // Colonnes obligatoires (doivent contenir des données)
    private static final List<String> REQUIRED_COLUMNS = Arrays.asList(
            "Asset_Name", "Projet", "Date_Revue", "Type", "Description", "Version", "Source_Origin"
    );
    
    // Toutes les colonnes attendues dans le fichier
    private static final List<String> ALL_COLUMNS = Arrays.asList(
            "Asset_Name", "Projet", "Date_Revue", "Type", "Description",
            "Technologie_CPE", "Technologie_sans_CPE", "Version", "CVEs_ID",
            "Vulns_ID", "Type_CVSS", "CVSS", "CWE-ID", "Vecteur_CVSS",
            "Source_Origin", "Référence_bulletin", "Commentaire_Supply Chain"
    );

    @Transactional
    public Map<String, Object> importPivotScan(MultipartFile file, String relatedAssetName) {
        logger.info("🔄 Début import Pivot: {} pour asset: {}", file.getOriginalFilename(), relatedAssetName);

        Map<String, Object> result = new HashMap<>();
        int totalRows = 0;
        int imported = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        try {
            // 1. Sauvegarder le fichier
            File savedFile = saveUploadedFile(file);

            // 2. Lire et parser le fichier Excel
            try (FileInputStream fis = new FileInputStream(savedFile);
                 Workbook workbook = new XSSFWorkbook(fis)) {

                Sheet sheet = workbook.getSheetAt(0);
                if (sheet == null) {
                    throw new IllegalArgumentException("Le fichier Excel ne contient aucune feuille");
                }

                // 3. Lire les en-têtes (première ligne)
                Row headerRow = sheet.getRow(0);
                if (headerRow == null) {
                    throw new IllegalArgumentException("Le fichier Excel ne contient pas d'en-têtes");
                }

                Map<String, Integer> columnIndices = parseHeaders(headerRow);

                // 4. Valider que toutes les colonnes obligatoires sont présentes
                validateRequiredColumns(columnIndices);

                // 5. Parser les lignes de données
                for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) {
                        continue;
                    }

                    totalRows++;

                    try {
                        Asset asset = parseRowToAsset(row, columnIndices, file.getOriginalFilename(), relatedAssetName);
                        
                        // Valider que les champs obligatoires ont des données
                        validateRequiredFields(asset);

                        Asset savedAsset = assetRepository.save(asset);
                        imported++;
                        
                        // Créer VulnerabilityResult si des CVEs sont présentes
                        createVulnerabilityResults(savedAsset, row, columnIndices, file.getOriginalFilename());
                        
                        logger.debug("✅ Asset importé: {}", asset.getName());
                    } catch (Exception e) {
                        skipped++;
                        String error = String.format("Ligne %d: %s", i + 1, e.getMessage());
                        errors.add(error);
                        logger.warn("⚠️ {}", error);
                    }
                }
            }

            logger.info("✅ Import Pivot terminé: {} lignes lues, {} importées, {} ignorées", 
                       totalRows, imported, skipped);

            result.put("success", true);
            result.put("totalRows", totalRows);
            result.put("imported", imported);
            result.put("skipped", skipped);
            result.put("errors", errors);
            result.put("fileName", file.getOriginalFilename());

        } catch (Exception e) {
            logger.error("❌ Erreur lors de l'import du fichier Pivot", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    private Map<String, Integer> parseHeaders(Row headerRow) {
        Map<String, Integer> columnIndices = new HashMap<>();
        
        for (Cell cell : headerRow) {
            String columnName = cell.getStringCellValue().trim();
            columnIndices.put(columnName, cell.getColumnIndex());
            logger.info("📋 Colonne détectée: '{}' à l'index {}", columnName, cell.getColumnIndex());
        }
        
        logger.info("📋 Total colonnes détectées: {}", columnIndices.keySet());
        return columnIndices;
    }

    private void validateRequiredColumns(Map<String, Integer> columnIndices) {
        List<String> missingColumns = new ArrayList<>();
        
        for (String requiredColumn : REQUIRED_COLUMNS) {
            if (!columnIndices.containsKey(requiredColumn)) {
                missingColumns.add(requiredColumn);
            }
        }
        
        if (!missingColumns.isEmpty()) {
            throw new IllegalArgumentException(
                "Colonnes obligatoires manquantes: " + String.join(", ", missingColumns)
            );
        }
    }

    private Asset parseRowToAsset(Row row, Map<String, Integer> columnIndices, String fileName, String relatedAssetName) {
        Asset asset = new Asset();
        
        // Champs obligatoires
        asset.setName(getCellValueAsString(row, columnIndices.get("Asset_Name")));
        asset.setDescription(getCellValueAsString(row, columnIndices.get("Description")));
        asset.setPackageVersion(getCellValueAsString(row, columnIndices.get("Version")));
        
        // Type d'asset
        asset.setType("PIVOT");
        
        // Nom du scan = nom du fichier
        asset.setScanName(fileName);
        
        // Lier à l'asset manuel
        asset.setRelatedAssetName(relatedAssetName);
        
        // Stocker toutes les données Pivot dans rawData
        Map<String, Object> rawData = new HashMap<>();
        rawData.put("scanType", "Pivot");
        
        // Colonnes obligatoires
        rawData.put("projet", getCellValueAsString(row, columnIndices.get("Projet")));
        rawData.put("dateRevue", getCellValueAsString(row, columnIndices.get("Date_Revue")));
        rawData.put("type", getCellValueAsString(row, columnIndices.get("Type")));
        rawData.put("sourceOrigin", getCellValueAsString(row, columnIndices.get("Source_Origin")));
        
        // Toutes les colonnes supplémentaires (avec gestion null-safe)
        putIfColumnExists(rawData, row, columnIndices, "Technologie_CPE", "technologieCPE");
        putIfColumnExists(rawData, row, columnIndices, "Technologie_sans_CPE", "technologieSansCPE");
        putIfColumnExists(rawData, row, columnIndices, "CVEs_ID", "cvesId");
        putIfColumnExists(rawData, row, columnIndices, "Vulns_ID", "vulnsId");
        putIfColumnExists(rawData, row, columnIndices, "Type_CVSS", "typeCVSS");
        putIfColumnExists(rawData, row, columnIndices, "CVSS", "cvss");
        putIfColumnExists(rawData, row, columnIndices, "CWE_ID", "cweId");
        putIfColumnExists(rawData, row, columnIndices, "Vecteur_CVSS", "vecteurCVSS");
        putIfColumnExists(rawData, row, columnIndices, "Référence_bulletin", "referenceBulletin");
        putIfColumnExists(rawData, row, columnIndices, "Commentaire_Supply Chain", "commentaireSupplyChain");
        
        asset.setRawData(rawData);
        asset.setScanDate(LocalDateTime.now());
        asset.setCreatedAt(LocalDateTime.now());
        
        return asset;
    }

    private void validateRequiredFields(Asset asset) {
        List<String> emptyFields = new ArrayList<>();
        
        if (isEmpty(asset.getName())) emptyFields.add("Asset_Name");
        if (isEmpty(asset.getDescription())) emptyFields.add("Description");
        if (isEmpty(asset.getPackageVersion())) emptyFields.add("Version");
        if (isEmpty((String) asset.getRawData().get("projet"))) emptyFields.add("Projet");
        if (isEmpty((String) asset.getRawData().get("dateRevue"))) emptyFields.add("Date_Revue");
        if (isEmpty((String) asset.getRawData().get("type"))) emptyFields.add("Type");
        if (isEmpty((String) asset.getRawData().get("sourceOrigin"))) emptyFields.add("Source_Origin");
        
        if (!emptyFields.isEmpty()) {
            throw new IllegalArgumentException(
                "Champs obligatoires vides: " + String.join(", ", emptyFields)
            );
        }
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
    
    private void putIfColumnExists(Map<String, Object> rawData, Row row, Map<String, Integer> columnIndices, String excelColumnName, String jsonKey) {
        if (columnIndices.containsKey(excelColumnName)) {
            String value = getCellValueAsString(row, columnIndices.get(excelColumnName));
            rawData.put(jsonKey, value);
        }
    }

    private String getCellValueAsString(Row row, Integer columnIndex) {
        if (columnIndex == null) {
            return "";
        }
        
        Cell cell = row.getCell(columnIndex);
        if (cell == null) {
            return "";
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().format(DateTimeFormatter.ISO_LOCAL_DATE);
                } else {
                    // Convertir nombre en string sans notation scientifique
                    double numValue = cell.getNumericCellValue();
                    if (numValue == Math.floor(numValue)) {
                        return String.valueOf((long) numValue);
                    } else {
                        return String.valueOf(numValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            case BLANK:
                return "";
            default:
                return "";
        }
    }

    private File saveUploadedFile(MultipartFile file) throws IOException {
        // Créer le répertoire s'il n'existe pas
        Path uploadPath = Paths.get(pivotUploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Sauvegarder le fichier
        String fileName = file.getOriginalFilename();
        Path filePath = uploadPath.resolve(fileName);
        Files.write(filePath, file.getBytes());

        logger.info("💾 Fichier sauvegardé: {}", filePath);
        return filePath.toFile();
    }

    @Transactional
    public Map<String, Object> deletePivotScan(String scanName) {
        logger.info("🗑️ Suppression du scan Pivot: {}", scanName);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Supprimer les assets
            List<Asset> assets = assetRepository.findByScanName(scanName);
            assetRepository.deleteAll(assets);
            
            logger.info("🗑️ Scan Pivot supprimé: {} assets supprimés", assets.size());
            
            result.put("success", true);
            result.put("message", "Scan Pivot supprimé avec succès");
            result.put("deletedAssets", assets.size());
            
        } catch (Exception e) {
            logger.error("❌ Erreur lors de la suppression du scan Pivot", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    public List<Map<String, Object>> listPivotScans() {
        logger.info("📋 Liste des scans Pivot");
        
        List<Asset> pivotAssets = assetRepository.findByType("PIVOT");
        
        // Grouper par scanName
        Map<String, List<Asset>> scanGroups = new HashMap<>();
        for (Asset asset : pivotAssets) {
            String scanName = asset.getScanName();
            scanGroups.computeIfAbsent(scanName, k -> new ArrayList<>()).add(asset);
        }
        
        // Créer la liste des scans
        List<Map<String, Object>> scans = new ArrayList<>();
        for (Map.Entry<String, List<Asset>> entry : scanGroups.entrySet()) {
            Map<String, Object> scan = new HashMap<>();
            scan.put("scanName", entry.getKey());
            scan.put("assetCount", entry.getValue().size());
            scan.put("scanDate", entry.getValue().get(0).getScanDate());
            scans.add(scan);
        }
        
        // Trier par date décroissante
        scans.sort((a, b) -> {
            LocalDateTime dateA = (LocalDateTime) a.get("scanDate");
            LocalDateTime dateB = (LocalDateTime) b.get("scanDate");
            return dateB.compareTo(dateA);
        });
        
        return scans;
    }

    public List<Map<String, Object>> getPivotScanData(String scanName) {
        logger.info("📋 Récupération des données du scan Pivot: {}", scanName);
        
        List<Asset> pivotAssets = assetRepository.findByScanName(scanName);
        
        return pivotAssets.stream()
            .filter(asset -> "PIVOT".equals(asset.getType()))
            .map(asset -> {
                Map<String, Object> data = new HashMap<>();
                data.put("id", asset.getId());
                data.put("name", asset.getName());
                data.put("description", asset.getDescription());
                data.put("packageVersion", asset.getPackageVersion());
                data.put("scanName", asset.getScanName());
                data.put("scanDate", asset.getScanDate());
                data.put("rawData", asset.getRawData());
                return data;
            })
            .collect(Collectors.toList());
    }
    
    private void createVulnerabilityResults(Asset asset, Row row, Map<String, Integer> columnIndices, String scanName) {
        // Récupérer les CVEs depuis la colonne CVEs_ID
        String cvesIdValue = getCellValueAsString(row, columnIndices.get("CVEs_ID"));
        if (cvesIdValue == null || cvesIdValue.trim().isEmpty() || cvesIdValue.equals("-")) {
            return; // Pas de CVE, rien à créer
        }
        
        // Séparer les CVEs (peuvent être séparées par virgule, point-virgule, etc.)
        String[] cveIds = cvesIdValue.split("[,;\\s]+");
        
        for (String cveId : cveIds) {
            cveId = cveId.trim();
            if (cveId.isEmpty() || !cveId.startsWith("CVE-")) {
                continue;
            }
            
            try {
                VulnerabilityResult vulnResult = new VulnerabilityResult();
                vulnResult.setCveId(cveId);
                vulnResult.setAssetId(asset.getId());
                vulnResult.setScanName(scanName);
                vulnResult.setPackageName(asset.getName());
                vulnResult.setPackageVersion(asset.getPackageVersion() != null ? asset.getPackageVersion() : "");
                
                // Récupérer le score CVSS depuis la colonne CVSS
                String cvssValue = getCellValueAsString(row, columnIndices.get("CVSS"));
                if (cvssValue != null && !cvssValue.isEmpty() && !cvssValue.equals("-")) {
                    try {
                        BigDecimal score = new BigDecimal(cvssValue);
                        vulnResult.setBaseScore(score);
                        vulnResult.setBaseSeverity(calculateSeverityLevel(score));
                    } catch (NumberFormatException e) {
                        logger.debug("Score CVSS invalide pour {}: {}", cveId, cvssValue);
                    }
                }
                
                // Type CVSS (version)
                String typeCvss = getCellValueAsString(row, columnIndices.get("Type_CVSS"));
                if (typeCvss != null && !typeCvss.isEmpty()) {
                    vulnResult.setCvssVersion(typeCvss);
                }
                
                // Vecteur CVSS
                String vecteurCvss = getCellValueAsString(row, columnIndices.get("Vecteur_CVSS"));
                if (vecteurCvss != null && !vecteurCvss.isEmpty() && !vecteurCvss.equals("-")) {
                    vulnResult.setVectorString(vecteurCvss);
                }
                
                // Enrichir depuis la base CVE si disponible
                Optional<Cve> cveOpt = cveRepository.findByCveId(cveId);
                if (cveOpt.isPresent()) {
                    Cve cve = cveOpt.get();
                    
                    // Description
                    if (asset.getDescription() != null) {
                        vulnResult.setCveDescription(asset.getDescription());
                    } else if (cve.getDescription() != null) {
                        vulnResult.setCveDescription(cve.getDescription());
                    }
                    
                    // Dates
                    if (cve.getPublished() != null) {
                        vulnResult.setPublishedDate(cve.getPublished());
                    }
                    if (cve.getLastModified() != null) {
                        vulnResult.setLastModifiedDate(cve.getLastModified());
                    }
                    
                    // Score depuis la base si pas dans Pivot
                    if (vulnResult.getBaseScore() == null && cve.getBaseScore() != null) {
                        vulnResult.setBaseScore(cve.getBaseScore());
                        vulnResult.setBaseSeverity(calculateSeverityLevel(cve.getBaseScore()));
                    }
                    
                    // Vecteur depuis la base si pas dans Pivot
                    if (vulnResult.getVectorString() == null && cve.getVectorString() != null) {
                        vulnResult.setVectorString(cve.getVectorString());
                    }
                } else {
                    // Pas de CVE dans la base, utiliser la description du Pivot
                    if (asset.getDescription() != null) {
                        vulnResult.setCveDescription(asset.getDescription());
                    }
                }
                
                vulnerabilityResultRepository.save(vulnResult);
                logger.debug("✅ VulnerabilityResult créé pour CVE: {} depuis Pivot", cveId);
                
            } catch (Exception e) {
                logger.warn("⚠️ Erreur lors de la création de VulnerabilityResult pour {}: {}", cveId, e.getMessage());
            }
        }
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
}

