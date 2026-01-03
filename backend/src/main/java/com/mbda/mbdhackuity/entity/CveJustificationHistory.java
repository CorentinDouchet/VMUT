package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "cve_justification_history")
@Data
public class CveJustificationHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cve_id", unique = true, nullable = false, length = 50)
    private String cveId;

    @Column(name = "package_name")
    private String packageName;

    @Column(name = "package_version", length = 100)
    private String packageVersion;

    @Column(name = "cve_description", columnDefinition = "TEXT")
    private String cveDescription;

    @Column(name = "base_score", precision = 3, scale = 1)
    private BigDecimal baseScore;

    @Column(name = "base_severity", length = 20)
    private String baseSeverity;

    @Column(name = "version_cvss", length = 20)
    private String versionCvss;

    @Column(name = "technologies_affectees", columnDefinition = "TEXT")
    private String technologiesAffectees;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "cpe_criteria", columnDefinition = "jsonb")
    private Map<String, Object> cpeCriteria;

    @Column(columnDefinition = "TEXT")
    private String cwe;

    @Column(name = "exploit_poc", length = 10)
    private String exploitPoc;

    @Column(name = "exploit_references", columnDefinition = "TEXT")
    private String exploitReferences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "comments_analyst", columnDefinition = "jsonb")
    private List<Map<String, Object>> commentsAnalyst;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "comments_validator", columnDefinition = "jsonb")
    private List<Map<String, Object>> commentsValidator;

    @Column(name = "justified_date")
    private LocalDateTime justifiedDate = LocalDateTime.now();

    @Column(name = "first_scan_name")
    private String firstScanName;
    
    @Column(name = "asset_id")
    private Long assetId;

    @Transient
    private String assetName;

    @Column(name = "vector_string", columnDefinition = "TEXT")
    private String vectorString;

    @Column(name = "published_date")
    private LocalDateTime publishedDate;

    @Column(name = "last_modified_date")
    private LocalDateTime lastModifiedDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}