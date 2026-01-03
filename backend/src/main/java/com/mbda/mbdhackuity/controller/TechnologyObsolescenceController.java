package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.entity.TechnologyObsolescence;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import com.mbda.mbdhackuity.service.TechnologyObsolescenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obsolescence")
public class TechnologyObsolescenceController {

    @Autowired
    private TechnologyObsolescenceService obsolescenceService;

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @GetMapping
    public ResponseEntity<List<TechnologyObsolescence>> getAll() {
        return ResponseEntity.ok(obsolescenceService.findAll());
    }

    @GetMapping("/obsolete")
    public ResponseEntity<List<TechnologyObsolescence>> getObsolete() {
        return ResponseEntity.ok(obsolescenceService.findObsolete());
    }

    @GetMapping("/technology/{name}")
    public ResponseEntity<List<TechnologyObsolescence>> getByTechnology(@PathVariable String name) {
        return ResponseEntity.ok(obsolescenceService.findByTechnology(name));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<TechnologyObsolescence> create(@RequestBody TechnologyObsolescence obsolescence) {
        return ResponseEntity.ok(obsolescenceService.save(obsolescence));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<TechnologyObsolescence> update(
            @PathVariable Long id,
            @RequestBody TechnologyObsolescence obsolescence) {
        obsolescence.setId(id);
        return ResponseEntity.ok(obsolescenceService.save(obsolescence));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        obsolescenceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/detected-vulnerabilities")
    public ResponseEntity<List<VulnerabilityResult>> getDetectedObsoleteVulnerabilities() {
        List<VulnerabilityResult> obsoleteVulns = vulnerabilityResultRepository.findByObsolescenceDetected(true);
        return ResponseEntity.ok(obsoleteVulns);
    }
}
