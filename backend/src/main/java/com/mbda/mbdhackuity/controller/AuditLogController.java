package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.entity.AuditLog;
import com.mbda.mbdhackuity.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/audit")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Recherche des logs avec filtres
     */
    @GetMapping("/logs")
    public ResponseEntity<Page<AuditLog>> getLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actionTarget,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("actionTimestamp").descending());
        Page<AuditLog> logs = auditLogService.searchLogs(userId, actionType, actionTarget, 
                                                         startDate, endDate, pageRequest);
        
        return ResponseEntity.ok(logs);
    }

    /**
     * Export CSV des logs
     */
    @GetMapping("/export")
    public ResponseEntity<String> exportLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actionTarget,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        String csv = auditLogService.exportToCsv(userId, actionType, actionTarget, startDate, endDate);
        
        String fileName = "audit_logs_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", fileName);
        headers.add("Content-Type", "text/csv; charset=UTF-8");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(csv);
    }

    /**
     * Statistiques globales
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        LocalDateTime last24h = LocalDateTime.now().minusHours(24);
        LocalDateTime last7d = LocalDateTime.now().minusDays(7);
        LocalDateTime last30d = LocalDateTime.now().minusDays(30);
        
        return ResponseEntity.ok(new Object() {
            public final long scanImports24h = auditLogService.countActionsSince("SCAN_IMPORT", last24h);
            public final long scanImports7d = auditLogService.countActionsSince("SCAN_IMPORT", last7d);
            public final long justifications24h = auditLogService.countActionsSince("JUSTIFICATION", last24h);
            public final long justifications7d = auditLogService.countActionsSince("JUSTIFICATION", last7d);
            public final long cvssAdjustments24h = auditLogService.countActionsSince("CVSS_ADJUSTMENT", last24h);
            public final long cvssAdjustments7d = auditLogService.countActionsSince("CVSS_ADJUSTMENT", last7d);
            public final long statusChanges24h = auditLogService.countActionsSince("STATUS_CHANGE", last24h);
            public final long statusChanges7d = auditLogService.countActionsSince("STATUS_CHANGE", last7d);
            public final long exports24h = auditLogService.countActionsSince("EXPORT", last24h);
            public final long exports7d = auditLogService.countActionsSince("EXPORT", last7d);
            public final long dbUpdates24h = auditLogService.countActionsSince("DATABASE_UPDATE", last24h);
            public final long dbUpdates7d = auditLogService.countActionsSince("DATABASE_UPDATE", last7d);
        });
    }

    /**
     * Enregistrement manuel d'une action (fallback si AOP ne capture pas)
     */
    @PostMapping("/log")
    public ResponseEntity<String> logAction(@RequestBody LogRequest request) {
        auditLogService.logAction(
            request.getUserId(),
            request.getActionType(),
            request.getActionTarget(),
            request.getActionDescription(),
            request.getActionDetails()
        );
        return ResponseEntity.ok("Action enregistrée");
    }

    // DTO pour le log manuel
    static class LogRequest {
        private String userId;
        private String actionType;
        private String actionTarget;
        private String actionDescription;
        private String actionDetails;

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getActionType() { return actionType; }
        public void setActionType(String actionType) { this.actionType = actionType; }
        public String getActionTarget() { return actionTarget; }
        public void setActionTarget(String actionTarget) { this.actionTarget = actionTarget; }
        public String getActionDescription() { return actionDescription; }
        public void setActionDescription(String actionDescription) { this.actionDescription = actionDescription; }
        public String getActionDetails() { return actionDetails; }
        public void setActionDetails(String actionDetails) { this.actionDetails = actionDetails; }
    }
}
