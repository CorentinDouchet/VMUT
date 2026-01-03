package com.mbda.mbdhackuity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO pour visualiser la hiérarchie d'assets (STB_REQ_0130)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetHierarchyDTO {
    
    private Long id;
    private String name;
    private String description;
    private String type;
    private String environment;
    private LocalDateTime createdAt;
    
    /**
     * ID du parent si cet asset est un sous-asset
     */
    private Long parentAssetId;
    
    /**
     * Nom du parent si cet asset est un sous-asset
     */
    private String parentAssetName;
    
    /**
     * Liste des sous-assets (enfants)
     */
    private List<AssetHierarchyDTO> subAssets = new ArrayList<>();
    
    /**
     * Profondeur dans la hiérarchie (0 = racine)
     */
    private int depth = 0;
    
    /**
     * Nombre total de sous-assets (récursif)
     */
    private int totalSubAssets = 0;
}
