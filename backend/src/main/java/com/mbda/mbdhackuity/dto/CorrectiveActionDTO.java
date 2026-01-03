package com.mbda.mbdhackuity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CorrectiveActionDTO {
    private String category;
    private String technology;
    private String description;
    private String currentVersion;
    private String targetVersion;
    private String maxSeverity;
    private Integer cveCount;
    private Integer affectedAssets;
    private String status; // available, pending, applied
    private Boolean isObsolete; // Marqueur d'obsolescence
    private String endOfSupport; // Date de fin de support
    private String endOfLife; // Date de fin de vie
}
