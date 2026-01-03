package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.ComplianceRuleDTO;
import com.mbda.mbdhackuity.dto.ComplianceStatsDTO;
import com.mbda.mbdhackuity.service.ComplianceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {

    @Autowired
    private ComplianceService complianceService;

    @GetMapping("/rules")
    public ResponseEntity<List<ComplianceRuleDTO>> getAllRules() {
        List<ComplianceRuleDTO> rules = complianceService.getAllRules();
        return ResponseEntity.ok(rules);
    }

    @GetMapping("/stats")
    public ResponseEntity<ComplianceStatsDTO> getStats() {
        ComplianceStatsDTO stats = complianceService.getComplianceStats();
        return ResponseEntity.ok(stats);
    }
}
