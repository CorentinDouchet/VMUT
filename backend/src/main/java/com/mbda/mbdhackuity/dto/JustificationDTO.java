package com.mbda.mbdhackuity.dto;

import com.mbda.mbdhackuity.entity.JustificationAttachment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO pour représenter une justification complète avec métadonnées
 * Utilisé pour la réutilisation des justifications (STB_REQ_0150)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JustificationDTO {
    
    private Long vulnerabilityId;
    private String cveId;
    private String packageName;
    private String packageVersion;
    private String commentsAnalyst;
    private String commentsValidator;
    private String validityStatus;
    private BigDecimal baseScore;
    private String baseSeverity;
    private String createdBy;
    private LocalDateTime lastModifiedDate;
    private List<JustificationAttachment> attachments;
    private Long assetId;
    private String assetName;
    
    // Indicateur si cette justification est déjà présente sur l'actif cible
    private boolean alreadyExistsOnTarget;
}
