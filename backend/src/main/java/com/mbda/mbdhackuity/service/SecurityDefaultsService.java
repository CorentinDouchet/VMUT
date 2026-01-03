package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.SecurityDefaultDTO;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SecurityDefaultsService {

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    /**
     * Récupère tous les défauts de sécurité (groupés par référence CVE/CWE)
     */
    public List<SecurityDefaultDTO> getAllSecurityDefaults() {
        List<VulnerabilityResult> vulnerabilities = vulnerabilityResultRepository.findAll();
        
        // Grouper par CVE ID et créer des SecurityDefaultDTO
        Map<String, List<VulnerabilityResult>> groupedByCve = vulnerabilities.stream()
                .filter(v -> v.getCveId() != null && !v.getCveId().isEmpty())
                .collect(Collectors.groupingBy(VulnerabilityResult::getCveId));

        List<SecurityDefaultDTO> defaults = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (Map.Entry<String, List<VulnerabilityResult>> entry : groupedByCve.entrySet()) {
            String cveId = entry.getKey();
            List<VulnerabilityResult> vulns = entry.getValue();
            
            // Prendre la première vulnérabilité pour les infos générales
            VulnerabilityResult firstVuln = vulns.get(0);
            
            SecurityDefaultDTO dto = new SecurityDefaultDTO();
            dto.setReference(cveId);
            dto.setName(firstVuln.getCveDescription() != null ? 
                    truncateDescription(firstVuln.getCveDescription()) : cveId);
            dto.setSeverity(determineSeverity(firstVuln.getBaseScore()));
            dto.setAffectedAssets(vulns.size());
            dto.setLastUpdate(firstVuln.getPublishedDate() != null ? 
                    firstVuln.getPublishedDate().format(formatter) : "N/A");
            dto.setStatus(determineStatus(firstVuln));
            dto.setCvssScore(firstVuln.getBaseScore() != null ? firstVuln.getBaseScore().doubleValue() : null);
            dto.setCweId(firstVuln.getCwe());
            
            defaults.add(dto);
        }

        // Trier par sévérité (critique en premier)
        defaults.sort((a, b) -> {
            int severityCompare = getSeverityOrder(b.getSeverity()) - getSeverityOrder(a.getSeverity());
            if (severityCompare != 0) return severityCompare;
            return Integer.compare(b.getAffectedAssets(), a.getAffectedAssets());
        });

        return defaults;
    }

    /**
     * Récupère les détails d'un défaut de sécurité spécifique
     */
    public SecurityDefaultDTO getSecurityDefaultDetails(String reference) {
        List<VulnerabilityResult> vulns = vulnerabilityResultRepository.findByCveId(reference);
        
        if (vulns.isEmpty()) {
            return null;
        }

        VulnerabilityResult firstVuln = vulns.get(0);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        
        SecurityDefaultDTO dto = new SecurityDefaultDTO();
        dto.setReference(reference);
        dto.setName(firstVuln.getCveDescription() != null ? firstVuln.getCveDescription() : reference);
        dto.setSeverity(determineSeverity(firstVuln.getBaseScore()));
        dto.setAffectedAssets(vulns.size());
        dto.setLastUpdate(firstVuln.getPublishedDate() != null ? 
                firstVuln.getPublishedDate().format(formatter) : "N/A");
        dto.setStatus(determineStatus(firstVuln));
        dto.setCvssScore(firstVuln.getBaseScore() != null ? firstVuln.getBaseScore().doubleValue() : null);
        dto.setCweId(firstVuln.getCwe());
        dto.setDescription(firstVuln.getCveDescription());
        
        return dto;
    }

    /**
     * Recherche des défauts de sécurité par critères
     */
    public List<SecurityDefaultDTO> searchDefaults(String searchTerm, String severity, String status) {
        List<SecurityDefaultDTO> allDefaults = getAllSecurityDefaults();
        
        return allDefaults.stream()
                .filter(d -> {
                    boolean matches = true;
                    
                    if (searchTerm != null && !searchTerm.isEmpty()) {
                        matches = d.getReference().toLowerCase().contains(searchTerm.toLowerCase()) ||
                                 d.getName().toLowerCase().contains(searchTerm.toLowerCase());
                    }
                    
                    if (severity != null && !severity.isEmpty()) {
                        matches = matches && d.getSeverity().equalsIgnoreCase(severity);
                    }
                    
                    if (status != null && !status.isEmpty()) {
                        matches = matches && d.getStatus().equalsIgnoreCase(status);
                    }
                    
                    return matches;
                })
                .collect(Collectors.toList());
    }

    /**
     * Obtient les statistiques des défauts de sécurité
     */
    public Map<String, Object> getSecurityDefaultsStats() {
        List<SecurityDefaultDTO> defaults = getAllSecurityDefaults();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", defaults.size());
        stats.put("critical", defaults.stream().filter(d -> "CRITIQUE".equals(d.getSeverity())).count());
        stats.put("high", defaults.stream().filter(d -> "ÉLEVÉE".equals(d.getSeverity())).count());
        stats.put("medium", defaults.stream().filter(d -> "MOYENNE".equals(d.getSeverity())).count());
        stats.put("low", defaults.stream().filter(d -> "FAIBLE".equals(d.getSeverity())).count());
        stats.put("totalAffectedAssets", defaults.stream().mapToInt(SecurityDefaultDTO::getAffectedAssets).sum());
        
        return stats;
    }

    // Méthodes utilitaires privées

    private String determineSeverity(BigDecimal baseScore) {
        if (baseScore == null) return "INCONNUE";
        double score = baseScore.doubleValue();
        if (score >= 9.0) return "CRITIQUE";
        if (score >= 7.0) return "ÉLEVÉE";
        if (score >= 4.0) return "MOYENNE";
        return "FAIBLE";
    }

    private String determineStatus(VulnerabilityResult vuln) {
        if (vuln.getValidityStatus() != null) {
            switch (vuln.getValidityStatus().toUpperCase()) {
                case "RESOLVED":
                case "FIXED":
                    return "PATCHED";
                case "IGNORED":
                case "WONT_FIX":
                    return "WONT_FIX";
                default:
                    return "ACTIVE";
            }
        }
        return "ACTIVE";
    }

    private String truncateDescription(String description) {
        if (description == null) return "";
        if (description.length() <= 80) return description;
        return description.substring(0, 77) + "...";
    }

    private int getSeverityOrder(String severity) {
        switch (severity.toUpperCase()) {
            case "CRITIQUE": return 4;
            case "ÉLEVÉE": return 3;
            case "MOYENNE": return 2;
            case "FAIBLE": return 1;
            default: return 0;
        }
    }
}
