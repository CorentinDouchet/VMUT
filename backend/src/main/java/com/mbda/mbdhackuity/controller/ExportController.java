package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.VulnerabilityExportRequest;
import com.mbda.mbdhackuity.service.ExportService;
import com.mbda.mbdhackuity.service.ExportService.ExportPayload;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private ExportService exportService;

    @PostMapping("/vulnerabilities")
    public ResponseEntity<Resource> exportVulnerabilities(@RequestBody VulnerabilityExportRequest request) {
        ExportPayload payload = exportService.exportVulnerabilities(request);

        return ResponseEntity.ok()
                .contentType(Objects.requireNonNull(payload.mediaType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + payload.fileName() + "\"")
                .body(payload.resource());
    }

    // GET /api/export/word/{scanName}
    @GetMapping("/word/{scanName}")
    public ResponseEntity<Resource> exportToWord(@PathVariable String scanName) {
        ExportPayload payload = exportService.exportVulnerabilities(
                buildLegacyRequest(scanName, "DOCX")
        );
        
        return ResponseEntity.ok()
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_OCTET_STREAM))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + payload.fileName() + "\"")
                .body(payload.resource());
    }

    // GET /api/export/csv/{scanName}
    @GetMapping("/csv/{scanName}")
    public ResponseEntity<Resource> exportToCsv(@PathVariable String scanName) {
        ExportPayload payload = exportService.exportVulnerabilities(
                buildLegacyRequest(scanName, "CSV")
        );
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + payload.fileName() + "\"")
                .body(payload.resource());
    }

    private VulnerabilityExportRequest buildLegacyRequest(String scanName, String format) {
        VulnerabilityExportRequest request = new VulnerabilityExportRequest();
        request.setAssetName(scanName);
        request.setFormat(format);
        request.setScopeDescription("Scan " + scanName);
        return request;
    }
}