package com.mbda.mbdhackuity.dto;

import lombok.Data;

/**
 * DTO pour la requête de duplication d'asset (STB_REQ_0140)
 */
@Data
public class AssetDuplicationRequest {
    
    /**
     * Nouveau nom pour l'asset dupliqué
     */
    private String newName;
    
    /**
     * Description pour l'asset dupliqué (optionnel)
     */
    private String newDescription;
    
    /**
     * Copier les vulnérabilités (packages scannés)
     */
    private boolean copyVulnerabilities = true;
    
    /**
     * Copier les justifications des vulnérabilités
     */
    private boolean copyJustifications = true;
    
    /**
     * Copier les pièces jointes des justifications
     */
    private boolean copyAttachments = false;
    
    /**
     * Créer comme nouvelle version (lien avec l'original)
     */
    private boolean createAsVersion = true;
    
    /**
     * Copier le groupe d'appartenance
     */
    private boolean copyGroup = true;
}
