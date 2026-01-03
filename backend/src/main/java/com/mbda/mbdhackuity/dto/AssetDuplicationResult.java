package com.mbda.mbdhackuity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour le résultat de duplication d'asset (STB_REQ_0140)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetDuplicationResult {
    
    /**
     * ID de l'asset nouvellement créé
     */
    private Long newAssetId;
    
    /**
     * Nom de l'asset nouvellement créé
     */
    private String newAssetName;
    
    /**
     * Nombre de vulnérabilités copiées
     */
    private int copiedVulnerabilities;
    
    /**
     * Nombre de justifications copiées
     */
    private int copiedJustifications;
    
    /**
     * Nombre de pièces jointes copiées
     */
    private int copiedAttachments;
    
    /**
     * Indique si c'est une version de l'asset original
     */
    private boolean isVersion;
    
    /**
     * Message de résumé
     */
    private String summary;
}
