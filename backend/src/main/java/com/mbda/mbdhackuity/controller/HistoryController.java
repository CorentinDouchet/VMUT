package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.CveJustificationRequest;
import com.mbda.mbdhackuity.dto.PageResponse;
import com.mbda.mbdhackuity.entity.CveJustificationHistory;
import com.mbda.mbdhackuity.service.HistoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
@Tag(name = "Historique", description = "Historique des justifications CVE")
public class HistoryController {

    @Autowired
    private HistoryService historyService;

    // POST /api/history/cve
    @PostMapping("/cve")
    public ResponseEntity<Map<String, Object>> addToHistory(
            @RequestBody CveJustificationRequest request) {
        return ResponseEntity.ok(historyService.addCveToHistory(request));
    }

    // GET /api/history/cves
    @GetMapping("/cves")
    public ResponseEntity<PageResponse<CveJustificationHistory>> getJustifiedCves(
            @RequestParam(required = false) String cveId,
            @RequestParam(required = false) String packageName,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) Long assetId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "justifiedDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        
        return ResponseEntity.ok(historyService.getJustifiedCves(
            cveId, packageName, severity, year, assetId, page, limit, sortBy, sortOrder
        ));
    }

    // GET /api/history/stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getHistoryStats() {
        return ResponseEntity.ok(historyService.getHistoryStats());
    }

    // GET /api/history/years
    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getHistoryYears() {
        return ResponseEntity.ok(historyService.getAvailableYears());
    }
}