package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.AuditLog;
import com.mbda.mbdhackuity.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private AuthenticationService authenticationService;

    private static final DateTimeFormatter CSV_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Enregistre une action dans le journal
     */
    @Transactional
    public void logAction(String userId, String actionType, String actionTarget, 
                         String actionDescription, String actionDetails) {
        // Si userId n'est pas fourni, utiliser l'utilisateur connecté
        String actualUserId = userId;
        if (actualUserId == null || actualUserId.isEmpty() || actualUserId.equals("admin")) {
            actualUserId = authenticationService.getCurrentUsername();
        }
        
        AuditLog log = new AuditLog();
        log.setUserId(actualUserId);
        log.setActionType(actionType);
        log.setActionTarget(actionTarget);
        log.setActionDescription(actionDescription);
        log.setActionDetails(actionDetails);
        log.setActionTimestamp(LocalDateTime.now());
        
        auditLogRepository.save(log);
    }

    /**
     * Log import de scan
     */
    public void logScanImport(String userId, String scanFileName, int packageCount, boolean success) {
        String description = String.format("Import du scan %s (%d packages)", scanFileName, packageCount);
        String details = String.format("{\"fileName\": \"%s\", \"packageCount\": %d, \"success\": %b}", 
                                      scanFileName, packageCount, success);
        logAction(userId, "SCAN_IMPORT", "scan", description, details);
    }

    /**
     * Log justification CVE
     */
    public void logJustification(String userId, String cveId, String assetName, String justification) {
        String description = String.format("Justification ajoutée pour %s sur %s", cveId, assetName);
        String details = String.format("{\"cveId\": \"%s\", \"assetName\": \"%s\", \"justification\": \"%s\"}", 
                                      cveId, assetName, justification.replace("\"", "\\\""));
        logAction(userId, "JUSTIFICATION", "cve", description, details);
    }

    /**
     * Log ajustement CVSS
     */
    public void logCvssAdjustment(String userId, String cveId, String assetName, 
                                 Double oldScore, Double newScore, String reason) {
        String description = String.format("CVSS ajusté pour %s sur %s: %.1f → %.1f", 
                                          cveId, assetName, oldScore, newScore);
        String details = String.format("{\"cveId\": \"%s\", \"assetName\": \"%s\", \"oldScore\": %.1f, \"newScore\": %.1f, \"reason\": \"%s\"}", 
                                      cveId, assetName, oldScore, newScore, reason.replace("\"", "\\\""));
        logAction(userId, "CVSS_ADJUSTMENT", "cve", description, details);
    }

    /**
     * Log changement de statut RSSI
     */
    public void logStatusChange(String userId, String cveId, String assetName, 
                               String oldStatus, String newStatus) {
        String description = String.format("Statut RSSI modifié pour %s sur %s: %s → %s", 
                                          cveId, assetName, oldStatus, newStatus);
        String details = String.format("{\"cveId\": \"%s\", \"assetName\": \"%s\", \"oldStatus\": \"%s\", \"newStatus\": \"%s\"}", 
                                      cveId, assetName, oldStatus, newStatus);
        logAction(userId, "STATUS_CHANGE", "cve", description, details);
    }

    /**
     * Log export de données
     */
    public void logExport(String userId, String exportType, String fileName, int recordCount) {
        String description = String.format("Export %s: %s (%d enregistrements)", 
                                          exportType, fileName, recordCount);
        String details = String.format("{\"exportType\": \"%s\", \"fileName\": \"%s\", \"recordCount\": %d}", 
                                      exportType, fileName, recordCount);
        logAction(userId, "EXPORT", "export", description, details);
    }

    /**
     * Log mise à jour base CVE/CPE
     */
    public void logDatabaseUpdate(String userId, String updateType, int recordsAffected, boolean success) {
        String description = String.format("Mise à jour %s: %d enregistrements", 
                                          updateType, recordsAffected);
        String details = String.format("{\"updateType\": \"%s\", \"recordsAffected\": %d, \"success\": %b}", 
                                      updateType, recordsAffected, success);
        logAction(userId, "DATABASE_UPDATE", "database", description, details);
    }

    /**
     * Recherche avec filtres
     */
    public Page<AuditLog> searchLogs(String userId, String actionType, String actionTarget,
                                    LocalDateTime startDate, LocalDateTime endDate, 
                                    Pageable pageable) {
        // Convertir null en chaîne vide pour éviter les problèmes PostgreSQL
        String userIdParam = userId != null && !userId.trim().isEmpty() ? userId : "";
        String actionTypeParam = actionType != null && !actionType.trim().isEmpty() ? actionType : "";
        String actionTargetParam = actionTarget != null && !actionTarget.trim().isEmpty() ? actionTarget : "";
        
        return auditLogRepository.searchLogs(userIdParam, actionTypeParam, actionTargetParam, 
                                            startDate, endDate, pageable);
    }

    /**
     * Export CSV
     */
    public String exportToCsv(String userId, String actionType, String actionTarget,
                             LocalDateTime startDate, LocalDateTime endDate) {
        // Convertir null en chaîne vide pour éviter les problèmes PostgreSQL
        String userIdParam = userId != null && !userId.trim().isEmpty() ? userId : "";
        String actionTypeParam = actionType != null && !actionType.trim().isEmpty() ? actionType : "";
        String actionTargetParam = actionTarget != null && !actionTarget.trim().isEmpty() ? actionTarget : "";
        
        List<AuditLog> logs = auditLogRepository.findAllForExport(userIdParam, actionTypeParam, actionTargetParam, 
                                                                  startDate, endDate);
        
        StringBuilder csv = new StringBuilder();
        csv.append("Date,Utilisateur,Type d'action,Cible,Description,Détails\n");
        
        for (AuditLog log : logs) {
            csv.append(escapeCsv(log.getActionTimestamp().format(CSV_DATE_FORMAT))).append(",");
            csv.append(escapeCsv(log.getUserId())).append(",");
            csv.append(escapeCsv(log.getActionType())).append(",");
            csv.append(escapeCsv(log.getActionTarget())).append(",");
            csv.append(escapeCsv(log.getActionDescription())).append(",");
            csv.append(escapeCsv(log.getActionDetails() != null ? log.getActionDetails() : "")).append("\n");
        }
        
        return csv.toString();
    }

    /**
     * Échappe les valeurs CSV
     */
    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /**
     * Statistiques d'activité
     */
    public long countActionsSince(String actionType, LocalDateTime since) {
        return auditLogRepository.countByActionTypeSince(actionType, since);
    }

    public long countUserActionsSince(String userId, LocalDateTime since) {
        return auditLogRepository.countByUserIdSince(userId, since);
    }
    
    // === Méthodes d'audit pour les groupes d'assets (STB_REQ_0101) ===
    
    /**
     * Journalise la création d'un groupe
     */
    public void logGroupCreation(Long groupId, String performedBy) {
        logAction(performedBy, "GROUP_CREATE", "GROUP", 
                 "Création du groupe d'assets", 
                 "Group ID: " + groupId);
    }
    
    /**
     * Journalise la mise à jour d'un groupe
     */
    public void logGroupUpdate(Long groupId, String performedBy) {
        logAction(performedBy, "GROUP_UPDATE", "GROUP", 
                 "Mise à jour du groupe d'assets", 
                 "Group ID: " + groupId);
    }
    
    /**
     * Journalise la suppression d'un groupe
     */
    public void logGroupDeletion(Long groupId, String performedBy) {
        logAction(performedBy, "GROUP_DELETE", "GROUP", 
                 "Suppression du groupe d'assets", 
                 "Group ID: " + groupId);
    }
    
    /**
     * Journalise l'ajout d'un utilisateur à un groupe
     */
    public void logUserAddedToGroup(Long groupId, Long userId, String performedBy) {
        logAction(performedBy, "GROUP_USER_ADD", "GROUP", 
                 "Ajout d'un utilisateur au groupe", 
                 "Group ID: " + groupId + ", User ID: " + userId);
    }
    
    /**
     * Journalise le retrait d'un utilisateur d'un groupe
     */
    public void logUserRemovedFromGroup(Long groupId, Long userId, String performedBy) {
        logAction(performedBy, "GROUP_USER_REMOVE", "GROUP", 
                 "Retrait d'un utilisateur du groupe", 
                 "Group ID: " + groupId + ", User ID: " + userId);
    }
    
    /**
     * Journalise l'ajout d'un asset à un groupe
     */
    public void logAssetAddedToGroup(Long groupId, Long assetId, String performedBy) {
        logAction(performedBy, "GROUP_ASSET_ADD", "GROUP", 
                 "Ajout d'un asset au groupe", 
                 "Group ID: " + groupId + ", Asset ID: " + assetId);
    }
    
    /**
     * Journalise le retrait d'un asset d'un groupe
     */
    public void logAssetRemovedFromGroup(Long groupId, Long assetId, String performedBy) {
        logAction(performedBy, "GROUP_ASSET_REMOVE", "GROUP", 
                 "Retrait d'un asset du groupe", 
                 "Group ID: " + groupId + ", Asset ID: " + assetId);
    }
}
