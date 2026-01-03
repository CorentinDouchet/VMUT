package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.entity.Cve;
import com.mbda.mbdhackuity.repository.CveRepository;
import com.mbda.mbdhackuity.service.OpenVASImportService;
import com.mbda.mbdhackuity.service.PivotScanService;
import com.mbda.mbdhackuity.service.ScanImportService;
import com.mbda.mbdhackuity.service.XmlReportParser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scan-import")
@Tag(name = "Import Scans", description = "Import et traitement des scans de vulnérabilités (Cyberwatch, OpenVAS)")
public class ScanImportController {

    private static final Logger logger = LoggerFactory.getLogger(ScanImportController.class);

    @org.springframework.beans.factory.annotation.Value("${app.uploads.xml.dir}")
    private String uploadsXmlDir;

    @Autowired
    private ScanImportService scanImportService;

    @Autowired
    private XmlReportParser xmlReportParser;

    @Autowired
    private CveRepository cveRepository;

    @Autowired
    private OpenVASImportService openvasImportService;

    @Autowired
    private PivotScanService pivotScanService;

    // POST /api/scan-import/upload
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadScan(
            @RequestParam("scanFile") MultipartFile file,
            @RequestParam(required = false) String scanName,
            @RequestParam(defaultValue = "true") boolean runMatching,
            @RequestParam(required = false) String relatedAssetName) {
        
        Map<String, Object> result = scanImportService.importScan(
            file, scanName, runMatching, relatedAssetName
        );
        
        return ResponseEntity.ok(result);
    }

    // POST /api/scan-import/upload-multiple
    @PostMapping("/upload-multiple")
    public ResponseEntity<Map<String, Object>> uploadMultipleScans(
            @RequestParam("scanFiles") List<MultipartFile> files,
            @RequestParam(defaultValue = "true") boolean runMatching,
            @RequestParam(required = false) String relatedAssetName) {
        
        Map<String, Object> result = scanImportService.importMultipleScans(
            files, runMatching, relatedAssetName
        );
        
        return ResponseEntity.ok(result);
    }

    // POST /api/scan-import/{scanName}/match
    @PostMapping("/{scanName}/match")
    public ResponseEntity<Map<String, Object>> runMatching(
            @PathVariable String scanName) {
        
        Map<String, Object> result = scanImportService.runCVEMatching(scanName);
        return ResponseEntity.ok(result);
    }

    // GET /api/scan-import/history
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getImportHistory(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(scanImportService.getImportHistory(limit));
    }

    // GET /api/scan-import/{id}/logs
    @GetMapping("/{id}/logs")
    public ResponseEntity<List<Map<String, Object>>> getImportLogs(
            @PathVariable Long id) {
        return ResponseEntity.ok(scanImportService.getImportLogs(id));
    }

    // GET /api/scan-import/stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getImportStats() {
        return ResponseEntity.ok(scanImportService.getImportStats());
    }

    // GET /api/scan-import/{scanName}/xml-report
    @GetMapping("/{scanName}/xml-report")
    public ResponseEntity<Map<String, Object>> getXmlReport(@PathVariable String scanName) {
        try {
            logger.info("🔍 Looking for XML report: {}", scanName);
            logger.info("📁 XML directory: {}", uploadsXmlDir);
            
            // Look for XML file in uploads/xml directory
            File xmlFile = new File(uploadsXmlDir, scanName);
            logger.info("🔍 First try: {} - exists: {}", xmlFile.getAbsolutePath(), xmlFile.exists());
            
            if (!xmlFile.exists()) {
                // Try with .xml extension
                xmlFile = new File(uploadsXmlDir, scanName + ".xml");
                logger.info("🔍 Second try: {} - exists: {}", xmlFile.getAbsolutePath(), xmlFile.exists());
            }
            
            if (!xmlFile.exists() || !xmlFile.getName().endsWith(".xml")) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "XML report not found for scan: " + scanName);
                return ResponseEntity.ok(error);
            }

            List<XmlReportParser.XmlCveData> cveList = xmlReportParser.parseXmlReport(xmlFile);
            
            // Enrich CVE data from database
            for (XmlReportParser.XmlCveData xmlCve : cveList) {
                Cve cve = cveRepository.findByCveId(xmlCve.getCveId()).orElse(null);
                if (cve != null) {
                    // Add publish date from database
                    if (cve.getPublished() != null) {
                        xmlCve.setPublishDate(cve.getPublished().toString());
                    }
                    // Override severity if not set
                    if (xmlCve.getSeverity() == null && cve.getBaseScore() != null) {
                        xmlCve.setSeverity(cve.getBaseScore().toString());
                    }
                    // Override CVSS vector if not set
                    if (xmlCve.getCvssVector() == null && cve.getVectorString() != null) {
                        xmlCve.setCvssVector(cve.getVectorString());
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("scanName", scanName);
            response.put("cveCount", cveList.size());
            response.put("cves", cveList);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error parsing XML report: " + e.getMessage());
            return ResponseEntity.ok(error);
        }
    }

    // POST /api/scan-import/upload-openvas
    @PostMapping("/upload-openvas")
    @Operation(summary = "Upload OpenVAS XML report", description = "Upload and import an OpenVAS XML report, creating VulnerabilityResult entries")
    public ResponseEntity<Map<String, Object>> uploadOpenVASXml(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String relatedAssetName) {
        
        Map<String, Object> result = openvasImportService.importOpenVASXml(file, relatedAssetName);
        return ResponseEntity.ok(result);
    }

    // DELETE /api/scan-import/{scanName}
    @DeleteMapping("/{scanName}")
    @Operation(summary = "Delete a Cyberwatch scan and its vulnerabilities")
    public ResponseEntity<Map<String, Object>> deleteCyberwatchScan(@PathVariable String scanName) {
        Map<String, Object> result = scanImportService.deleteScan(scanName);
        return ResponseEntity.ok(result);
    }

    // DELETE /api/scan-import/openvas/{scanName}
    @DeleteMapping("/openvas/{scanName}")
    @Operation(summary = "Delete an OpenVAS scan and its vulnerabilities")
    public ResponseEntity<Map<String, Object>> deleteOpenVASScan(@PathVariable String scanName) {
        Map<String, Object> result = openvasImportService.deleteScan(scanName);
        return ResponseEntity.ok(result);
    }

    // ========================================
    // PIVOT SCANNER ENDPOINTS
    // ========================================

    // POST /api/scan-import/upload-pivot
    @PostMapping("/upload-pivot")
    @Operation(summary = "Upload Pivot Excel file", description = "Upload and import a Pivot .xlsx file with required columns")
    public ResponseEntity<Map<String, Object>> uploadPivotScan(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String relatedAssetName) {
        
        Map<String, Object> result = pivotScanService.importPivotScan(file, relatedAssetName);
        return ResponseEntity.ok(result);
    }

    // GET /api/scan-import/pivot/list
    @GetMapping("/pivot/list")
    @Operation(summary = "List all Pivot scans")
    public ResponseEntity<List<Map<String, Object>>> listPivotScans() {
        List<Map<String, Object>> scans = pivotScanService.listPivotScans();
        return ResponseEntity.ok(scans);
    }

    // GET /api/scan-import/pivot/{scanName}/data
    @GetMapping("/pivot/{scanName}/data")
    @Operation(summary = "Get Pivot scan data")
    public ResponseEntity<List<Map<String, Object>>> getPivotScanData(@PathVariable String scanName) {
        List<Map<String, Object>> data = pivotScanService.getPivotScanData(scanName);
        return ResponseEntity.ok(data);
    }

    // DELETE /api/scan-import/pivot/{scanName}
    @DeleteMapping("/pivot/{scanName}")
    @Operation(summary = "Delete a Pivot scan")
    public ResponseEntity<Map<String, Object>> deletePivotScan(@PathVariable String scanName) {
        Map<String, Object> result = pivotScanService.deletePivotScan(scanName);
        return ResponseEntity.ok(result);
    }
}