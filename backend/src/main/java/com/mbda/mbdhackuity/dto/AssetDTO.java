package com.mbda.mbdhackuity.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssetDTO {
    private Long id;
    private String scanName;
    private String packageName;
    private String packageVersion;
    private String osName;
    private String osVersion;
    private String hostname;
    private LocalDateTime scanDate;
    private Integer vulnerabilityCount;
    private Double maxCvssScore;
    private String maxSeverity;
}