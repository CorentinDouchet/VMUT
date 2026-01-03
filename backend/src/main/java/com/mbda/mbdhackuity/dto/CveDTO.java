package com.mbda.mbdhackuity.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public class CveDTO {
    private String cveId;
    private LocalDateTime published;
    private LocalDateTime lastModified;
    private BigDecimal baseScore;
    private String baseSeverity;
    private String cvssVersion;
    private String description;
    private String vulnStatus;
    private Map<String, Object> cpeCriteria;
}