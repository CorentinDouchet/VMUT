package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.CveDTO;
import com.mbda.mbdhackuity.dto.PageResponse;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import com.mbda.mbdhackuity.service.CveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cves")
@Tag(name = "CVE", description = "Gestion de l'encyclopédie CVE et des vulnérabilités")
public class CveController {

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @Autowired
    private CveService cveService;

    @GetMapping
    public ResponseEntity<?> getAllVulnerabilities(
            @RequestParam(required = false) String scanName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        
        if (scanName != null) {
            return ResponseEntity.ok(
                vulnerabilityResultRepository.findByScanNameOrderByScoreDesc(scanName)
            );
        }
        
        // Pagination pour éviter de charger toute la DB
        org.springframework.data.domain.Pageable pageable = 
            org.springframework.data.domain.PageRequest.of(page, size, 
                org.springframework.data.domain.Sort.by("score").descending());
        org.springframework.data.domain.Page<VulnerabilityResult> results = 
            vulnerabilityResultRepository.findAll(pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/years")
    public ResponseEntity<List<Integer>> getAvailableYears() {
        return ResponseEntity.ok(cveService.getAvailableYears());
    }

    @GetMapping("/cvss-versions")
    public ResponseEntity<List<String>> getCvssVersions() {
        return ResponseEntity.ok(cveService.getCvssVersions());
    }

    @GetMapping("/statuses")
    public ResponseEntity<List<String>> getStatuses() {
        return ResponseEntity.ok(cveService.getStatuses());
    }

    @GetMapping("/scores")
    public ResponseEntity<List<BigDecimal>> getAvailableScores() {
        return ResponseEntity.ok(cveService.getAvailableScores());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@RequestParam(required = false) String year) {
        return ResponseEntity.ok(cveService.getStats(year));
    }

    @GetMapping("/list")
    public ResponseEntity<PageResponse<CveDTO>> getCvesWithFilters(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String cveId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cvssVersion,
            @RequestParam(required = false) BigDecimal scoreMin,
            @RequestParam(required = false) BigDecimal scoreMax,
            @RequestParam(required = false) BigDecimal score,
            @RequestParam(required = false) String cpe,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String publishedStart,
            @RequestParam(required = false) String publishedEnd,
            @RequestParam(required = false) String modifiedStart,
            @RequestParam(required = false) String modifiedEnd,
            @RequestParam(required = false) String attackVector,
            @RequestParam(required = false) String attackComplexity,
            @RequestParam(required = false) String privilegesRequired,
            @RequestParam(required = false) String userInteraction,
            @RequestParam(required = false) String cwe,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "cveId") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        return ResponseEntity.ok(cveService.getCvesWithFilters(
            year, severity, search, cveId, status, cvssVersion,
            scoreMin, scoreMax, score, cpe, keyword, publishedStart, publishedEnd,
            modifiedStart, modifiedEnd, attackVector, attackComplexity,
            privilegesRequired, userInteraction, cwe, page, limit, sortBy, sortOrder
        ));
    }

    @GetMapping("/{cveId}")
    public ResponseEntity<Map<String, Object>> getCveById(@PathVariable String cveId) {
        return ResponseEntity.ok(cveService.getCveDetails(cveId));
    }

    @GetMapping("/{cveId}/details")
    public ResponseEntity<Map<String, Object>> getCveDetails(@PathVariable String cveId) {
        return ResponseEntity.ok(cveService.getCveDetails(cveId));
    }

    @GetMapping("/export")
    public ResponseEntity<List<CveDTO>> exportCves(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String cveId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cvssVersion,
            @RequestParam(required = false) BigDecimal scoreMin,
            @RequestParam(required = false) BigDecimal scoreMax,
            @RequestParam(required = false) BigDecimal score,
            @RequestParam(required = false) String cpe,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String publishedStart,
            @RequestParam(required = false) String publishedEnd,
            @RequestParam(required = false) String modifiedStart,
            @RequestParam(required = false) String modifiedEnd,
            @RequestParam(required = false) String attackVector,
            @RequestParam(required = false) String attackComplexity,
            @RequestParam(required = false) String privilegesRequired,
            @RequestParam(required = false) String userInteraction,
            @RequestParam(required = false) String cwe) {
        return ResponseEntity.ok(cveService.exportCves(
            year, severity, search, cveId, status, cvssVersion,
            scoreMin, scoreMax, score, cpe, keyword, publishedStart, publishedEnd,
            modifiedStart, modifiedEnd, attackVector, attackComplexity,
            privilegesRequired, userInteraction, cwe
        ));
    }
}