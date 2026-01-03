package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "technology_obsolescence")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TechnologyObsolescence {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "technology_name", nullable = false)
    private String technologyName;
    
    @Column(name = "version_pattern")
    private String versionPattern; // Pattern de version (ex: "1.x", "2.*", null pour toutes versions)
    
    @Column(name = "latest_version")
    private String latestVersion; // Dernière version stable disponible
    
    @Column(name = "is_obsolete", nullable = false)
    private Boolean isObsolete = false;
    
    @Column(name = "end_of_support")
    private LocalDate endOfSupport; // Date de fin de support
    
    @Column(name = "end_of_life")
    private LocalDate endOfLife; // Date de fin de vie
    
    @Column(name = "replacement_recommendation")
    private String replacementRecommendation; // Recommandation de remplacement
    
    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification; // Justification de l'obsolescence
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "created_at")
    private LocalDate createdAt;
    
    @Column(name = "updated_at")
    private LocalDate updatedAt;
}
