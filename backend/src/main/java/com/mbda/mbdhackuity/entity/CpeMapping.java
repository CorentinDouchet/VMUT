package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Entité pour le mapping manuel CPE (STB_REQ_0210)
 * Permet d'associer manuellement des composants non reconnus à des identifiants CPE
 */
@Entity
@Table(name = "cpe_mappings", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"package_name", "package_version"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CpeMapping {
    
    /**
     * Énumération des niveaux de confiance
     */
    public enum ConfidenceLevel {
        HIGH, MEDIUM, LOW
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Nom du composant (ex: "apache-tomcat", "openssl")
     */
    @Column(name = "package_name", nullable = false, length = 255)
    private String packageName;
    
    /**
     * Version du composant (ex: "2.4.52", "1.1.1k")
     * Peut être null pour un mapping générique sur toutes les versions
     */
    @Column(name = "package_version", length = 100)
    private String packageVersion;
    
    /**
     * Identifiant CPE associé
     * Format: cpe:2.3:a:vendor:product:version:...
     */
    @Column(name = "cpe_uri", nullable = false, length = 500)
    private String cpeUri;
    
    /**
     * Vendor extrait du CPE pour faciliter les recherches
     */
    @Column(name = "vendor", length = 100)
    private String vendor;
    
    /**
     * Product extrait du CPE pour faciliter les recherches
     */
    @Column(name = "product", length = 100)
    private String product;
    
    /**
     * Commentaire ou justification du mapping
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    /**
     * Niveau de confiance du mapping (HIGH, MEDIUM, LOW)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_level", length = 20, nullable = false)
    @Builder.Default
    private ConfidenceLevel confidenceLevel = ConfidenceLevel.HIGH;
    
    /**
     * Nombre de fois que ce mapping a été utilisé
     */
    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0;
    
    /**
     * Utilisateur ayant créé le mapping
     */
    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;
    
    /**
     * Date de création
     */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * Dernière utilisation du mapping
     */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    /**
     * Utilisateur ayant modifié le mapping
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    /**
     * Date de dernière modification
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Mapping validé par un administrateur
     */
    @Column(name = "is_validated")
    @Builder.Default
    private Boolean isValidated = false;
    
    /**
     * Mapping actif/inactif
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
