package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class CvssService {

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public VulnerabilityResult updateScore(Long id, BigDecimal score, 
            String vector, String severity, String modifiedBy) {
        
        VulnerabilityResult vuln = vulnerabilityResultRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vulnérabilité non trouvée"));

        vuln.setModifiedScore(score);
        vuln.setModifiedVector(vector);
        vuln.setModifiedSeverity(severity);
        vuln.setModifiedBy(modifiedBy != null ? modifiedBy : "User");
        vuln.setModifiedAt(LocalDateTime.now());
        
        // Update RSSI status
        updateRssiStatus(vuln);

        VulnerabilityResult saved = vulnerabilityResultRepository.save(vuln);
        
        // Log audit de l'ajustement CVSS
        auditLogService.logCvssAdjustment(
            modifiedBy != null ? modifiedBy : "User",
            vuln.getCveId(),
            vuln.getScanName(),
            vuln.getBaseScore() != null ? vuln.getBaseScore().doubleValue() : 0.0,
            score.doubleValue(),
            "Ajustement via calculatrice CVSS: " + vector
        );
        
        return saved;
    }

    @Transactional
    public VulnerabilityResult resetScore(Long id) {
        VulnerabilityResult vuln = vulnerabilityResultRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vulnérabilité non trouvée"));

        vuln.setModifiedScore(null);
        vuln.setModifiedVector(null);
        vuln.setModifiedSeverity(null);
        vuln.setModifiedBy(null);
        vuln.setModifiedAt(null);
        
        // Update RSSI status
        updateRssiStatus(vuln);

        return vulnerabilityResultRepository.save(vuln);
    }

    @Transactional
    @SuppressWarnings({"unchecked", "null"})
    public VulnerabilityResult addComment(Long id, String comment, 
            String author, String role) {
        
        if (comment == null || comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Le commentaire ne peut pas être vide");
        }

        VulnerabilityResult vuln = vulnerabilityResultRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vulnérabilité non trouvée"));

        Map<String, Object> newComment = new HashMap<>();
        newComment.put("id", System.currentTimeMillis());
        newComment.put("text", comment.trim());
        newComment.put("author", author != null ? author : "Utilisateur");
        newComment.put("timestamp", LocalDateTime.now().toString());

        List<Map<String, Object>> comments = new ArrayList<>();
        
        String commentsStr = vuln.getComments();
        if (commentsStr != null && !commentsStr.isEmpty()) {
            try {
                comments = objectMapper.readValue(commentsStr, List.class);
            } catch (Exception e) {
                comments = new ArrayList<>();
            }
        }
        comments.add(newComment);
        try {
            vuln.setComments(objectMapper.writeValueAsString(comments));
        } catch (Exception e) {
            vuln.setComments(null);
        }
        
        // Update RSSI status
        updateRssiStatus(vuln);

        return vulnerabilityResultRepository.save(vuln);
    }

    @Transactional
    @SuppressWarnings({"unchecked", "null"})
    public VulnerabilityResult deleteComment(Long vulnId, Long commentId, String role) {
        VulnerabilityResult vuln = vulnerabilityResultRepository.findById(vulnId)
            .orElseThrow(() -> new RuntimeException("Vulnérabilité non trouvée"));

        List<Map<String, Object>> comments = new ArrayList<>();
        String commentsStr = vuln.getComments();

        if (commentsStr != null && !commentsStr.isEmpty()) {
            try {
                comments = objectMapper.readValue(commentsStr, List.class);
            } catch (Exception e) {
                comments = new ArrayList<>();
            }
        }

        if (!comments.isEmpty()) {
            comments.removeIf(comment -> {
                Object id = comment.get("id");
                return id != null && id.toString().equals(commentId.toString());
            });

            try {
                String updatedCommentsStr = objectMapper.writeValueAsString(comments);
                vuln.setComments(updatedCommentsStr);
            } catch (Exception e) {
                // Could not serialize, leave as is
            }
        }
        
        // Update RSSI status
        updateRssiStatus(vuln);

        return vulnerabilityResultRepository.save(vuln);
    }

    @SuppressWarnings("null")
    public VulnerabilityResult getVulnerabilityWithEffectiveScores(Long id) {
        return vulnerabilityResultRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Vulnérabilité non trouvée"));
    }

    @Transactional
    public Map<String, Object> addBulkComment(List<Long> ids, String comment, 
            String author, String role) {
        
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("IDs requis");
        }

        if (comment == null || comment.trim().isEmpty()) {
            throw new IllegalArgumentException("Commentaire requis");
        }

        Map<String, Object> newComment = new HashMap<>();
        newComment.put("id", System.currentTimeMillis());
        newComment.put("text", comment.trim());
        newComment.put("author", author != null ? author : "Utilisateur");
        newComment.put("timestamp", LocalDateTime.now().toString());

        List<VulnerabilityResult> updated = new ArrayList<>();

        for (Long id : ids) {
            try {
                VulnerabilityResult vuln = addComment(id, comment, author, role);
                updated.add(vuln);
            } catch (Exception e) {
                // Log l'erreur mais continue
                System.err.println("Erreur ajout commentaire pour ID " + id + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("updated", updated.size());
        result.put("cves", updated);

        return result;
    }
    
    /**
     * Met à jour le statut RSSI en fonction des commentaires et du score modifié
     */
    @SuppressWarnings("unchecked")
    private void updateRssiStatus(VulnerabilityResult vuln) {
        boolean hasComments = false;
        
        // Vérifier si des commentaires existent
        String commentsStr = vuln.getComments();
        if (commentsStr != null && !commentsStr.trim().isEmpty()) {
            try {
                List<Map<String, Object>> comments = objectMapper.readValue(commentsStr, List.class);
                hasComments = comments != null && !comments.isEmpty();
            } catch (Exception e) {
                hasComments = false;
            }
        }
        
        // Vérifier si un score modifié existe
        boolean hasModifiedScore = vuln.getModifiedScore() != null;
        
        // Définir le statut RSSI
        if (hasComments || hasModifiedScore) {
            vuln.setRssiStatus("Traité");
        } else {
            vuln.setRssiStatus("Non traité");
        }
    }
}
