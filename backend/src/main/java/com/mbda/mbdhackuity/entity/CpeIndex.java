package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "cpe_index")
@Data
public class CpeIndex {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cve_id", length = 50)
    private String cveId;

    @Column(name = "cpe_string", columnDefinition = "TEXT")
    private String cpeString;

    @Column(length = 255)
    private String vendor;

    @Column(length = 255)
    private String product;

    @Column(length = 255)
    private String version;

    @Column(name = "version_start_including", length = 100)
    private String versionStartIncluding;

    @Column(name = "version_start_excluding", length = 100)
    private String versionStartExcluding;

    @Column(name = "version_end_including", length = 100)
    private String versionEndIncluding;

    @Column(name = "version_end_excluding", length = 100)
    private String versionEndExcluding;

    @Column(name = "is_vulnerable")
    private Boolean isVulnerable = true;
}