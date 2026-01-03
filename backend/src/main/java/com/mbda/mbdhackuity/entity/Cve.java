package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cves")
@Data
public class Cve {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cve_id", unique = true, nullable = false, length = 50)
    private String cveId;

    @Column(name = "source_identifier")
    private String sourceIdentifier;

    private LocalDateTime published;

    @Column(name = "last_modified")
    private LocalDateTime lastModified;

    @Column(name = "vuln_status", length = 50)
    private String vulnStatus;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_score", precision = 3, scale = 1)
    private BigDecimal baseScore;

    @Column(name = "base_severity", length = 20)
    private String baseSeverity;

    @Column(name = "vector_string")
    private String vectorString;

    @Column(name = "cvss_version", length = 10)
    private String cvssVersion;

    // JSON fields - stored as TEXT to avoid deserialization issues
    @Column(name = "cpe_criteria", columnDefinition = "TEXT")
    private String cpeCriteria;

    @Column(name = "cve_references", columnDefinition = "TEXT")
    private String cveReferences;

    @Column(name = "raw_data", columnDefinition = "TEXT")
    private String rawData;

    // New fields for NIST-like details
    @Column(name = "cwes", columnDefinition = "TEXT")
    private String cwes;  // JSON: [{"id": "CWE-256", "description": "Plaintext Storage of a Password", "source": "CERT.PL"}]

    @Column(name = "assigner")
    private String assigner;  // CNA source (e.g., "CERT.PL", "cve@mitre.org")

    @Column(name = "change_history", columnDefinition = "TEXT")
    private String changeHistory;  // JSON: [{"date": "2025-11-14", "action": "Initial Analysis"}]
}