package com.mbda.mbdhackuity.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "assets")
@Data
public class Asset {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "type")
    private String type; // MANUAL, CYBERWATCH, OPENVAS

    @Column(name = "related_asset_name")
    private String relatedAssetName; // Nom de l'asset manuel auquel ce scan est lié

    @Column(name = "scan_name")
    private String scanName;

    @Column(name = "package_name")
    private String packageName;

    @Column(name = "package_version", length = 100)
    private String packageVersion;

    @Column(name = "os_name", length = 100)
    private String osName;

    @Column(name = "os_version", length = 100)
    private String osVersion;

    @Column(length = 255)
    private String hostname;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_data", columnDefinition = "jsonb")
    private Map<String, Object> rawData;

    @Column(name = "scan_date")
    private LocalDateTime scanDate = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // === Champs pour STB_REQ_0102 : Gestion avancée des assets ===
    
    @Column(name = "serial_number", length = 100)
    private String serialNumber;
    
    @Column(name = "part_number", length = 100)
    private String partNumber;
    
    @Column(name = "environment", length = 50)
    private String environment; // PROD, TEST, DEV
    
    @Column(name = "uuid", length = 255)
    private String uuid;
    
    @Column(name = "version", length = 50)
    private String version;
    
    @Column(name = "creation_mode", length = 20)
    private String creationMode; // MANUAL, SCAN, PIVOT
    
    // === Relation avec AssetGroup (STB_REQ_0101) ===
    
    @ManyToOne
    @JoinColumn(name = "asset_group_id")
    private AssetGroup assetGroup;
    
    // === Support des sous-assets (STB_REQ_0130) ===
    
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "parent_asset_id")
    private Asset parentAsset;
    
    @JsonIgnore
    @OneToMany(mappedBy = "parentAsset")
    private java.util.Set<Asset> subAssets = new java.util.HashSet<>();
    
    // === Versioning d'assets (STB_REQ_0140) ===
    
    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "previous_version_id")
    private Asset previousVersion;
}