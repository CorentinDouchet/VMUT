package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cve_matches")
@Data
public class CveMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cve_id", length = 50)
    private String cveId;

    @Column(name = "asset_id")
    private Long assetId;

    @Column(name = "match_confidence", precision = 3, scale = 2)
    private BigDecimal matchConfidence;

    @Column(name = "matched_on", length = 50)
    private String matchedOn;

    @Column(name = "match_date")
    private LocalDateTime matchDate = LocalDateTime.now();
}