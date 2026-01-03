package com.mbda.mbdhackuity.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "compliance_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference", unique = true, nullable = false)
    private String reference; // CIS-1.1.1, NIST-AC-1, etc.

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "framework", nullable = false)
    private String framework; // CIS, NIST, ISO, PCI-DSS, GDPR, HIPAA

    @Column(name = "level", nullable = false)
    private String level; // CRITIQUE, ÉLEVÉE, MOYENNE, FAIBLE

    @Column(name = "status")
    private String status; // compliant, non-compliant, partial, not-checked

    @Column(name = "affected_assets")
    private Integer affectedAssets;

    @Column(name = "last_checked")
    private LocalDateTime lastChecked;

    @Column(name = "remediation", length = 2000)
    private String remediation; // Instructions pour corriger

    @Column(name = "category")
    private String category; // System, Network, Application, Database

    @Column(name = "automated")
    private Boolean automated; // Vérification automatisable ou manuelle
}
