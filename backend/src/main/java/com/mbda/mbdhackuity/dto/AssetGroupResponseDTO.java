package com.mbda.mbdhackuity.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO de réponse pour un groupe d'assets avec détails complets
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetGroupResponseDTO {
    
    private Long id;
    private String name;
    private String description;
    private String plmContainer;
    
    // Informations sur les utilisateurs
    private Set<UserSummaryDTO> users;
    
    // Informations sur les assets
    private Set<AssetSummaryDTO> assets;
    
    // Statistiques
    private Integer userCount;
    private Integer assetCount;
    
    // Métadonnées
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    
    /**
     * DTO simple pour résumer un utilisateur
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDTO {
        private Long id;
        private String username;
        private String fullName;
        private String role;
    }
    
    /**
     * DTO simple pour résumer un asset
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetSummaryDTO {
        private Long id;
        private String name;
        private String serialNumber;
        private String partNumber;
        private String environment;
    }
}
