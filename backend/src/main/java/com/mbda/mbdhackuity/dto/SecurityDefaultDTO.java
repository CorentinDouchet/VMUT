package com.mbda.mbdhackuity.dto;

public class SecurityDefaultDTO {
    private Long id;
    private String reference;  // CVE-ID ou CWE-ID
    private String name;       // Nom du défaut
    private String description;
    private String severity;   // CRITIQUE, ÉLEVÉE, MOYENNE, FAIBLE
    private Integer affectedAssets;
    private String lastUpdate;
    private String status;     // ACTIVE, PATCHED, WONT_FIX
    private Double cvssScore;
    private String cweId;

    // Constructeurs
    public SecurityDefaultDTO() {
    }

    public SecurityDefaultDTO(String reference, String name, String severity, 
                            Integer affectedAssets, String lastUpdate, String status) {
        this.reference = reference;
        this.name = name;
        this.severity = severity;
        this.affectedAssets = affectedAssets;
        this.lastUpdate = lastUpdate;
        this.status = status;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Integer getAffectedAssets() {
        return affectedAssets;
    }

    public void setAffectedAssets(Integer affectedAssets) {
        this.affectedAssets = affectedAssets;
    }

    public String getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(String lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getCvssScore() {
        return cvssScore;
    }

    public void setCvssScore(Double cvssScore) {
        this.cvssScore = cvssScore;
    }

    public String getCweId() {
        return cweId;
    }

    public void setCweId(String cweId) {
        this.cweId = cweId;
    }
}
