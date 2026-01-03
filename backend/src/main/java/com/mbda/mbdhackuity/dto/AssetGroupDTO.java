package com.mbda.mbdhackuity.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * DTO pour la création/mise à jour d'un groupe d'assets
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetGroupDTO {
    
    private Long id;
    private String name;
    private String description;
    private String plmContainer;
    private Set<Long> userIds;
    private Set<Long> assetIds;
    private LocalDateTime createdAt;
    private String createdBy;
}
