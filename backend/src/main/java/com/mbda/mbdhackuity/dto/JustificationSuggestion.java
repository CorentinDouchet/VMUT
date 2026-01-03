package com.mbda.mbdhackuity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour suggérer des justifications réutilisables
 * Retourne les CVE qui ont des justifications sur d'autres actifs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JustificationSuggestion {
    
    private String cveId;
    private int availableJustificationCount;
    private String mostRecentAssetName;
    private String previewComment;
}
