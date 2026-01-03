package com.mbda.mbdhackuity.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class CveJustificationRequest {
    private String cveId;
    private String packageName;
    private String packageVersion;
    private String cveDescription;
    private BigDecimal baseScore;
    private String baseSeverity;
    private String versionCvss;
    private String technologiesAffectees;
    private Map<String, Object> cpeCriteria;
    private String cwe;
    private String exploitPoc;
    private String exploitReferences;
    private List<Map<String, Object>> commentsAnalyst;
    private List<Map<String, Object>> commentsValidator;
    private String scanName;
    private String vectorString;
    private LocalDateTime publishedDate;
    private LocalDateTime lastModifiedDate;
}