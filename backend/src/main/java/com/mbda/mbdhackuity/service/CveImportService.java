package com.mbda.mbdhackuity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mbda.mbdhackuity.entity.Cve;
import com.mbda.mbdhackuity.entity.CpeIndex;
import com.mbda.mbdhackuity.repository.CveRepository;
import com.mbda.mbdhackuity.repository.CpeIndexRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CveImportService {

    private static final Logger log = LoggerFactory.getLogger(CveImportService.class);

    @Value("${app.cve.data.dir}")
    private String cveDataDir;

    @Autowired
    private CveRepository cveRepository;

    @Autowired
    private CpeIndexRepository cpeIndexRepository;
    
    @Autowired
    private EntityManager entityManager;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Import all CVE JSON files from the cve_data directory
     */
    public Map<String, Object> importAllCveFiles() {
        log.info("🚀 Starting CVE import from directory: {}", cveDataDir);
        
        Map<String, Object> result = new HashMap<>();
        List<String> processedFiles = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int totalImported = 0;
        int totalSkipped = 0;
        int totalErrors = 0;
        
        File dataDir = new File(cveDataDir);
        log.info("📁 Checking directory: {}", dataDir.getAbsolutePath());
        
        if (!dataDir.exists() || !dataDir.isDirectory()) {
            String msg = "CVE data directory not found: " + cveDataDir + " (absolute: " + dataDir.getAbsolutePath() + ")";
            log.error("❌ {}", msg);
            result.put("success", false);
            result.put("message", msg);
            return result;
        }

        File[] jsonFiles = dataDir.listFiles((dir, name) -> name.endsWith(".json"));
        if (jsonFiles == null || jsonFiles.length == 0) {
            String msg = "No JSON files found in: " + cveDataDir;
            log.error("❌ {}", msg);
            result.put("success", false);
            result.put("message", msg);
            return result;
        }

        log.info("📁 Found {} JSON files to process", jsonFiles.length);

        for (File jsonFile : jsonFiles) {
            try {
                log.info("📖 Processing file: {} ({} MB)", jsonFile.getName(), jsonFile.length() / (1024 * 1024));
                Map<String, Object> fileResult = importCveFileWithTransaction(jsonFile);
                
                processedFiles.add(jsonFile.getName());
                totalImported += (int) fileResult.getOrDefault("imported", 0);
                totalSkipped += (int) fileResult.getOrDefault("skipped", 0);
                totalErrors += (int) fileResult.getOrDefault("errors", 0);
                
            } catch (Exception e) {
                log.error("❌ Error processing file {}: {}", jsonFile.getName(), e.getMessage(), e);
                errors.add(jsonFile.getName() + ": " + e.getMessage());
            }
        }

        result.put("success", true);
        result.put("filesProcessed", processedFiles.size());
        result.put("totalImported", totalImported);
        result.put("totalSkipped", totalSkipped);
        result.put("totalErrors", totalErrors);
        result.put("processedFiles", processedFiles);
        result.put("errors", errors);
        
        log.info("✅ CVE import completed. Imported: {}, Skipped: {}, Errors: {}", totalImported, totalSkipped, totalErrors);
        
        // Build CPE index automatically after import (even if no new CVE imported)
        long totalCves = cveRepository.count();
        long totalCpeIndex = cpeIndexRepository.count();
        
        log.info("📊 Database stats: {} total CVE, {} CPE index entries", totalCves, totalCpeIndex);
        
        if (totalCves > 0 && totalCpeIndex == 0) {
            log.info("🏗️ CPE index is empty but CVE exist. Building CPE index automatically...");
            try {
                Map<String, Object> indexResult = buildCpeIndex();
                result.put("cpeIndexBuilt", true);
                result.put("cpeIndexResult", indexResult);
                log.info("✅ CPE index built: {} entries created", indexResult.get("cpeCreated"));
            } catch (Exception e) {
                log.error("❌ Failed to build CPE index: {}", e.getMessage(), e);
                result.put("cpeIndexBuilt", false);
                result.put("cpeIndexError", e.getMessage());
            }
        } else if (totalImported > 0 && totalCpeIndex > 0) {
            log.info("🔄 New CVE imported. Rebuilding CPE index...");
            try {
                Map<String, Object> indexResult = buildCpeIndex();
                result.put("cpeIndexBuilt", true);
                result.put("cpeIndexResult", indexResult);
                log.info("✅ CPE index rebuilt: {} entries created", indexResult.get("cpeCreated"));
            } catch (Exception e) {
                log.error("❌ Failed to rebuild CPE index: {}", e.getMessage(), e);
                result.put("cpeIndexBuilt", false);
                result.put("cpeIndexError", e.getMessage());
            }
        } else {
            log.info("⏭️ CPE index already exists ({} entries), no rebuild needed", totalCpeIndex);
            result.put("cpeIndexBuilt", false);
            result.put("cpeIndexAlreadyExists", true);
        }
        
        return result;
    }

    /**
     * Import with transaction wrapper
     */
    @Transactional
    public Map<String, Object> importCveFileWithTransaction(File jsonFile) throws Exception {
        return importCveFile(jsonFile);
    }

    /**
     * Import CVEs from a single JSON file (NVD CVE format)
     */
    public Map<String, Object> importCveFile(File jsonFile) throws Exception {
        Map<String, Object> result = new HashMap<>();
        int imported = 0;
        int skipped = 0;
        int errors = 0;

        log.info("📂 Reading file: {}", jsonFile.getAbsolutePath());
        JsonNode root = objectMapper.readTree(jsonFile);
        JsonNode vulnerabilities = root.get("vulnerabilities");

        if (vulnerabilities == null || !vulnerabilities.isArray()) {
            throw new Exception("Invalid CVE JSON format - 'vulnerabilities' array not found");
        }

        int totalVulns = vulnerabilities.size();
        log.info("📊 Processing {} vulnerabilities from {}", totalVulns, jsonFile.getName());

        for (JsonNode vulnNode : vulnerabilities) {
            JsonNode cveNode = vulnNode.get("cve");
            if (cveNode == null) {
                log.warn("⚠️ No 'cve' node found, skipping");
                errors++;
                continue;
            }

            try {
                String cveId = cveNode.get("id").asText();
                
                // Skip if already exists
                if (cveRepository.findByCveId(cveId).isPresent()) {
                    skipped++;
                    if (skipped % 100 == 0) {
                        log.info("⏭️ Skipped {} existing CVEs", skipped);
                    }
                    continue;
                }

                Cve cve = parseCveFromJson(cveNode);
                cveRepository.save(cve);
                cveRepository.flush(); // Force immediate save
                imported++;

                if (imported % 50 == 0) {
                    log.info("✅ Progress: {} imported, {} skipped, {} errors ({}%)", 
                        imported, skipped, errors, (imported + skipped) * 100 / totalVulns);
                }

            } catch (Exception e) {
                log.error("❌ Error parsing CVE: {}", e.getMessage());
                errors++;
            }
        }

        log.info("📈 Final stats for {}: {} imported, {} skipped, {} errors", 
            jsonFile.getName(), imported, skipped, errors);

        result.put("imported", imported);
        result.put("skipped", skipped);
        result.put("errors", errors);
        result.put("filename", jsonFile.getName());

        return result;
    }

    /**
     * Parse a CVE entity from NVD JSON format
     */
    private Cve parseCveFromJson(JsonNode cveNode) {
        Cve cve = new Cve();

        // Basic CVE info
        cve.setCveId(cveNode.get("id").asText());
        
        if (cveNode.has("sourceIdentifier")) {
            cve.setSourceIdentifier(cveNode.get("sourceIdentifier").asText());
        }

        if (cveNode.has("published")) {
            cve.setPublished(parseDateTime(cveNode.get("published").asText()));
        }

        if (cveNode.has("lastModified")) {
            cve.setLastModified(parseDateTime(cveNode.get("lastModified").asText()));
        }

        if (cveNode.has("vulnStatus")) {
            cve.setVulnStatus(cveNode.get("vulnStatus").asText());
        }

        // Description
        JsonNode descriptions = cveNode.get("descriptions");
        if (descriptions != null && descriptions.isArray() && descriptions.size() > 0) {
            for (JsonNode desc : descriptions) {
                if ("en".equals(desc.get("lang").asText())) {
                    cve.setDescription(desc.get("value").asText());
                    break;
                }
            }
        }

        // CVSS Metrics (try v3.1, v3.0, v2.0 in order)
        JsonNode metrics = cveNode.get("metrics");
        if (metrics != null) {
            parseCvssMetrics(cve, metrics);
        }

        // CPE Criteria (configurations)
        JsonNode configurations = cveNode.get("configurations");
        if (configurations != null) {
            cve.setCpeCriteria(configurations.toString());
        }

        // References
        JsonNode references = cveNode.get("references");
        if (references != null) {
            cve.setCveReferences(references.toString());
        }

        // CWEs (Weakness Enumeration)
        JsonNode weaknesses = cveNode.get("weaknesses");
        if (weaknesses != null && weaknesses.isArray()) {
            cve.setCwes(parseWeaknesses(weaknesses));
        }

        // Assigner (CNA source)
        if (cveNode.has("sourceIdentifier")) {
            cve.setAssigner(cveNode.get("sourceIdentifier").asText());
        }

        // Change History (if available in rawData - typically parsed from metrics changes)
        // Note: NVD doesn't always provide detailed change history in the JSON
        // This can be enhanced by tracking modifications over time
        
        // Store raw data for future use
        cve.setRawData(cveNode.toString());

        return cve;
    }

    /**
     * Parse CWE weaknesses from JSON into structured format
     */
    private String parseWeaknesses(JsonNode weaknesses) {
        try {
            List<Map<String, String>> cweList = new ArrayList<>();
            
            for (JsonNode weaknessNode : weaknesses) {
                JsonNode descriptions = weaknessNode.get("description");
                if (descriptions != null && descriptions.isArray()) {
                    for (JsonNode desc : descriptions) {
                        Map<String, String> cweEntry = new HashMap<>();
                        cweEntry.put("id", desc.get("value").asText());
                        
                        // Try to get CWE description from external source or cache
                        // For now, just store the ID - descriptions can be fetched from MITRE
                        String cweId = desc.get("value").asText();
                        cweEntry.put("description", getCweDescription(cweId));
                        
                        // Source is typically the submitter
                        if (weaknessNode.has("source")) {
                            cweEntry.put("source", weaknessNode.get("source").asText());
                        } else {
                            cweEntry.put("source", "N/A");
                        }
                        
                        cweList.add(cweEntry);
                    }
                }
            }
            
            return objectMapper.writeValueAsString(cweList);
        } catch (Exception e) {
            log.error("Error parsing weaknesses: {}", e.getMessage());
            return "[]";
        }
    }

    /**
     * Get CWE description (basic mapping - can be enhanced with external API)
     */
    private String getCweDescription(String cweId) {
        // Basic CWE descriptions - this is a simplified version
        Map<String, String> commonCwes = new HashMap<>();
        commonCwes.put("CWE-79", "Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')");
        commonCwes.put("CWE-89", "Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')");
        commonCwes.put("CWE-20", "Improper Input Validation");
        commonCwes.put("CWE-78", "Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')");
        commonCwes.put("CWE-94", "Improper Control of Generation of Code ('Code Injection')");
        commonCwes.put("CWE-22", "Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')");
        commonCwes.put("CWE-352", "Cross-Site Request Forgery (CSRF)");
        commonCwes.put("CWE-434", "Unrestricted Upload of File with Dangerous Type");
        commonCwes.put("CWE-862", "Missing Authorization");
        commonCwes.put("CWE-918", "Server-Side Request Forgery (SSRF)");
        commonCwes.put("CWE-119", "Improper Restriction of Operations within the Bounds of a Memory Buffer");
        commonCwes.put("CWE-200", "Exposure of Sensitive Information to an Unauthorized Actor");
        commonCwes.put("CWE-787", "Out-of-bounds Write");
        commonCwes.put("CWE-125", "Out-of-bounds Read");
        commonCwes.put("CWE-416", "Use After Free");
        commonCwes.put("CWE-190", "Integer Overflow or Wraparound");
        commonCwes.put("CWE-287", "Improper Authentication");
        commonCwes.put("CWE-476", "NULL Pointer Dereference");
        commonCwes.put("CWE-798", "Use of Hard-coded Credentials");
        commonCwes.put("CWE-306", "Missing Authentication for Critical Function");
        commonCwes.put("CWE-502", "Deserialization of Untrusted Data");
        commonCwes.put("CWE-276", "Incorrect Default Permissions");
        commonCwes.put("CWE-732", "Incorrect Permission Assignment for Critical Resource");
        commonCwes.put("CWE-269", "Improper Privilege Management");
        commonCwes.put("CWE-863", "Incorrect Authorization");
        commonCwes.put("CWE-522", "Insufficiently Protected Credentials");
        commonCwes.put("CWE-611", "Improper Restriction of XML External Entity Reference");
        commonCwes.put("CWE-639", "Authorization Bypass Through User-Controlled Key");
        commonCwes.put("CWE-770", "Allocation of Resources Without Limits or Throttling");
        commonCwes.put("CWE-400", "Uncontrolled Resource Consumption");
        commonCwes.put("CWE-295", "Improper Certificate Validation");
        commonCwes.put("CWE-327", "Use of a Broken or Risky Cryptographic Algorithm");
        commonCwes.put("CWE-601", "URL Redirection to Untrusted Site ('Open Redirect')");
        commonCwes.put("CWE-311", "Missing Encryption of Sensitive Data");
        commonCwes.put("CWE-532", "Insertion of Sensitive Information into Log File");
        commonCwes.put("CWE-326", "Inadequate Encryption Strength");
        commonCwes.put("CWE-913", "Improper Control of Dynamically-Managed Code Resources");
        commonCwes.put("CWE-427", "Uncontrolled Search Path Element");
        commonCwes.put("CWE-94", "Improper Control of Generation of Code ('Code Injection')");
        commonCwes.put("CWE-77", "Improper Neutralization of Special Elements used in a Command ('Command Injection')");
        commonCwes.put("CWE-120", "Buffer Copy without Checking Size of Input ('Classic Buffer Overflow')");
        commonCwes.put("CWE-829", "Inclusion of Functionality from Untrusted Control Sphere");
        commonCwes.put("CWE-770", "Allocation of Resources Without Limits or Throttling");
        commonCwes.put("CWE-908", "Use of Uninitialized Resource");
        commonCwes.put("CWE-617", "Reachable Assertion");
        commonCwes.put("CWE-668", "Exposure of Resource to Wrong Sphere");
        commonCwes.put("CWE-91", "XML Injection (aka Blind XPath Injection)");
        commonCwes.put("CWE-284", "Improper Access Control");
        commonCwes.put("CWE-835", "Loop with Unreachable Exit Condition ('Infinite Loop')");
        commonCwes.put("CWE-674", "Uncontrolled Recursion");
        commonCwes.put("CWE-347", "Improper Verification of Cryptographic Signature");
        commonCwes.put("CWE-640", "Weak Password Recovery Mechanism for Forgotten Password");
        commonCwes.put("CWE-426", "Untrusted Search Path");
        commonCwes.put("CWE-362", "Concurrent Execution using Shared Resource with Improper Synchronization ('Race Condition')");
        commonCwes.put("CWE-404", "Improper Resource Shutdown or Release");
        commonCwes.put("CWE-755", "Improper Handling of Exceptional Conditions");
        commonCwes.put("CWE-706", "Use of Incorrectly-Resolved Name or Reference");
        commonCwes.put("CWE-665", "Improper Initialization");
        commonCwes.put("CWE-193", "Off-by-one Error");
        commonCwes.put("CWE-415", "Double Free");
        commonCwes.put("CWE-824", "Access of Uninitialized Pointer");
        commonCwes.put("CWE-401", "Missing Release of Memory after Effective Lifetime");
        commonCwes.put("CWE-134", "Use of Externally-Controlled Format String");
        commonCwes.put("CWE-681", "Incorrect Conversion between Numeric Types");
        commonCwes.put("CWE-843", "Access of Resource Using Incompatible Type ('Type Confusion')");
        commonCwes.put("CWE-763", "Release of Invalid Pointer or Reference");
        commonCwes.put("CWE-754", "Improper Check for Unusual or Exceptional Conditions");
        commonCwes.put("CWE-704", "Incorrect Type Conversion or Cast");
        commonCwes.put("CWE-669", "Incorrect Resource Transfer Between Spheres");
        commonCwes.put("CWE-697", "Incorrect Comparison");
        commonCwes.put("CWE-273", "Improper Check for Dropped Privileges");
        commonCwes.put("CWE-241", "Improper Handling of Unexpected Data Type");
        commonCwes.put("CWE-426", "Untrusted Search Path");
        commonCwes.put("CWE-256", "Plaintext Storage of a Password");
        
        return commonCwes.getOrDefault(cweId, "N/A");
    }

    /**
     * Parse CVSS metrics from JSON (supports v4.0, v3.1, v3.0, v2.0)
     */
    private void parseCvssMetrics(Cve cve, JsonNode metrics) {
        // Try CVSS v4.0 first (newest)
        if (metrics.has("cvssMetricV40") && metrics.get("cvssMetricV40").isArray()) {
            JsonNode v40Array = metrics.get("cvssMetricV40");
            if (v40Array.size() > 0) {
                JsonNode cvssData = v40Array.get(0).get("cvssData");
                if (cvssData != null) {
                    cve.setCvssVersion("4.0");
                    cve.setBaseScore(BigDecimal.valueOf(cvssData.get("baseScore").asDouble()));
                    cve.setBaseSeverity(cvssData.get("baseSeverity").asText());
                    cve.setVectorString(cvssData.get("vectorString").asText());
                    return;
                }
            }
        }
        
        // Try CVSS v3.1
        if (metrics.has("cvssMetricV31") && metrics.get("cvssMetricV31").isArray()) {
            JsonNode v31Array = metrics.get("cvssMetricV31");
            if (v31Array.size() > 0) {
                JsonNode cvssData = v31Array.get(0).get("cvssData");
                if (cvssData != null) {
                    cve.setCvssVersion("3.1");
                    cve.setBaseScore(BigDecimal.valueOf(cvssData.get("baseScore").asDouble()));
                    cve.setBaseSeverity(cvssData.get("baseSeverity").asText());
                    cve.setVectorString(cvssData.get("vectorString").asText());
                    return;
                }
            }
        }

        // Try CVSS v3.0
        if (metrics.has("cvssMetricV30") && metrics.get("cvssMetricV30").isArray()) {
            JsonNode v30Array = metrics.get("cvssMetricV30");
            if (v30Array.size() > 0) {
                JsonNode cvssData = v30Array.get(0).get("cvssData");
                if (cvssData != null) {
                    cve.setCvssVersion("3.0");
                    cve.setBaseScore(BigDecimal.valueOf(cvssData.get("baseScore").asDouble()));
                    cve.setBaseSeverity(cvssData.get("baseSeverity").asText());
                    cve.setVectorString(cvssData.get("vectorString").asText());
                    return;
                }
            }
        }

        // Try CVSS v2.0
        if (metrics.has("cvssMetricV2") && metrics.get("cvssMetricV2").isArray()) {
            JsonNode v2Array = metrics.get("cvssMetricV2");
            if (v2Array.size() > 0) {
                JsonNode cvssData = v2Array.get(0).get("cvssData");
                if (cvssData != null) {
                    cve.setCvssVersion("2.0");
                    cve.setBaseScore(BigDecimal.valueOf(cvssData.get("baseScore").asDouble()));
                    
                    // CVSS v2 doesn't have baseSeverity, calculate it
                    double score = cvssData.get("baseScore").asDouble();
                    String severity = score >= 7.0 ? "HIGH" : score >= 4.0 ? "MEDIUM" : "LOW";
                    cve.setBaseSeverity(severity);
                    
                    cve.setVectorString(cvssData.get("vectorString").asText());
                }
            }
        }
    }

    /**
     * Parse ISO 8601 datetime string
     */
    private LocalDateTime parseDateTime(String dateTimeStr) {
        try {
            // Remove 'Z' or timezone info and parse
            String cleaned = dateTimeStr.replace("Z", "").split("\\+")[0].split("-\\d{2}:\\d{2}")[0];
            return LocalDateTime.parse(cleaned, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (Exception e) {
            log.warn("Failed to parse datetime: {}", dateTimeStr);
            return LocalDateTime.now();
        }
    }

    /**
     * Get import statistics
     */
    public Map<String, Object> getImportStats() {
        Map<String, Object> stats = new HashMap<>();
        
        Long totalCves = cveRepository.countAll();
        stats.put("totalCves", totalCves);
        
        // Count by severity
        stats.put("critical", cveRepository.countBySeverity("CRITICAL"));
        stats.put("high", cveRepository.countBySeverity("HIGH"));
        stats.put("medium", cveRepository.countBySeverity("MEDIUM"));
        stats.put("low", cveRepository.countBySeverity("LOW"));
        
        // CPE index stats
        stats.put("totalCpeIndex", cpeIndexRepository.count());
        
        // Check available JSON files
        File dataDir = new File(cveDataDir);
        if (dataDir.exists() && dataDir.isDirectory()) {
            File[] jsonFiles = dataDir.listFiles((dir, name) -> name.endsWith(".json"));
            stats.put("availableFiles", jsonFiles != null ? jsonFiles.length : 0);
        } else {
            stats.put("availableFiles", 0);
        }
        
        return stats;
    }

    /**
     * Build CPE index from all CVE in database using direct SQL
     * This is much faster than parsing JSON in Java
     */
    @Transactional
    public Map<String, Object> buildCpeIndex() {
        log.info("🏗️ Building CPE index using SQL...");
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Clear existing index
            log.info("🗑️ Clearing existing CPE index...");
            entityManager.createNativeQuery("TRUNCATE TABLE cpe_index CASCADE").executeUpdate();
            
            // Build index using SQL (much faster than Java parsing)
            String sql = """
                INSERT INTO cpe_index (
                    cve_id,
                    cpe_string,
                    vendor,
                    product,
                    version,
                    version_start_including,
                    version_start_excluding,
                    version_end_including,
                    version_end_excluding,
                    is_vulnerable
                )
                SELECT 
                    c.cve_id,
                    match->>'criteria' AS cpe_string,
                    NULLIF(split_part(match->>'criteria', ':', 4), '*') AS vendor,
                    NULLIF(split_part(match->>'criteria', ':', 5), '*') AS product,
                    NULLIF(split_part(match->>'criteria', ':', 6), '*') AS version,
                    match->>'versionStartIncluding' AS version_start_including,
                    match->>'versionStartExcluding' AS version_start_excluding,
                    match->>'versionEndIncluding' AS version_end_including,
                    match->>'versionEndExcluding' AS version_end_excluding,
                    CAST(match->>'vulnerable' AS boolean) AS is_vulnerable
                FROM 
                    cves c,
                    LATERAL (
                        SELECT jsonb_array_elements(CAST(c.cpe_criteria AS jsonb)) AS config_item
                    ) configs,
                    LATERAL (
                        SELECT jsonb_array_elements(configs.config_item->'nodes') AS node
                    ) nodes,
                    LATERAL (
                        SELECT jsonb_array_elements(nodes.node->'cpeMatch') AS match
                    ) matches
                WHERE 
                    c.cpe_criteria IS NOT NULL 
                    AND c.cpe_criteria != ''
                    AND jsonb_exists(matches.match, 'vulnerable')
                    AND CAST(matches.match->>'vulnerable' AS boolean) = true
                    AND jsonb_exists(matches.match, 'criteria')
                    AND NULLIF(split_part(matches.match->>'criteria', ':', 5), '*') IS NOT NULL
                """;
            
            log.info("⏳ Executing SQL to build CPE index...");
            int rowsInserted = entityManager.createNativeQuery(sql).executeUpdate();
            
            long elapsed = (System.currentTimeMillis() - startTime) / 1000;
            log.info("✅ CPE index built: {} entries created in {}s", rowsInserted, elapsed);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("cpeCreated", rowsInserted);
            result.put("elapsedSeconds", elapsed);
            
            return result;
            
        } catch (Exception e) {
            log.error("❌ Failed to build CPE index: {}", e.getMessage(), e);
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("error", e.getMessage());
            return result;
        }
    }

    /**
     * Parse CPE entries from JSON criteria
     */
    private List<CpeIndex> parseCpeFromCriteria(String cveId, String cpeCriteriaJson) {
        List<CpeIndex> results = new ArrayList<>();
        
        try {
            JsonNode root = objectMapper.readTree(cpeCriteriaJson);
            extractCpeFromNode(cveId, root, results);
        } catch (Exception e) {
            log.debug("Failed to parse CPE criteria for {}: {}", cveId, e.getMessage());
        }
        
        return results;
    }

    /**
     * Recursively extract CPE match criteria from JSON node
     */
    private void extractCpeFromNode(String cveId, JsonNode node, List<CpeIndex> results) {
        if (node == null) {
            return;
        }
        
        // Process nodes array
        if (node.has("nodes") && node.get("nodes").isArray()) {
            for (JsonNode child : node.get("nodes")) {
                extractCpeFromNode(cveId, child, results);
            }
        }
        
        // Process cpeMatch array
        if (node.has("cpeMatch") && node.get("cpeMatch").isArray()) {
            for (JsonNode match : node.get("cpeMatch")) {
                if (match.has("vulnerable") && match.get("vulnerable").asBoolean()) {
                    CpeIndex cpe = new CpeIndex();
                    cpe.setCveId(cveId);
                    cpe.setIsVulnerable(true);
                    
                    // Parse CPE URI: cpe:2.3:a:vendor:product:version:...
                    if (match.has("criteria")) {
                        String cpeUri = match.get("criteria").asText();
                        cpe.setCpeString(cpeUri);
                        
                        String[] parts = cpeUri.split(":");
                        if (parts.length >= 5) {
                            cpe.setVendor(parts[3].equals("*") ? null : parts[3]);
                            cpe.setProduct(parts[4].equals("*") ? null : parts[4]);
                            if (parts.length > 5 && !parts[5].equals("*")) {
                                cpe.setVersion(parts[5]);
                            }
                        }
                    }
                    
                    // Version ranges
                    if (match.has("versionStartIncluding")) {
                        cpe.setVersionStartIncluding(match.get("versionStartIncluding").asText());
                    }
                    if (match.has("versionStartExcluding")) {
                        cpe.setVersionStartExcluding(match.get("versionStartExcluding").asText());
                    }
                    if (match.has("versionEndIncluding")) {
                        cpe.setVersionEndIncluding(match.get("versionEndIncluding").asText());
                    }
                    if (match.has("versionEndExcluding")) {
                        cpe.setVersionEndExcluding(match.get("versionEndExcluding").asText());
                    }
                    
                    // Only add if we have at least a product name
                    if (cpe.getProduct() != null && !cpe.getProduct().isEmpty()) {
                        results.add(cpe);
                    }
                }
            }
        }
    }
}
