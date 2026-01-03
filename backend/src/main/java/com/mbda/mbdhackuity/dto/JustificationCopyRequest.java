package com.mbda.mbdhackuity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO pour la requête de copie de justifications
 * STB_REQ_0150: Réutilisation des justifications entre actifs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JustificationCopyRequest {
    
    private Long sourceAssetId;
    private Long targetAssetId;
    private List<String> cveIds;
    private boolean copyAttachments;
    
    // Option pour écraser les justifications existantes ou les ignorer
    private boolean overwriteExisting;
}
