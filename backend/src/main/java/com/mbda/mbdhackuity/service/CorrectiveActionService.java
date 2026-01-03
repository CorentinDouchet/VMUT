package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.CorrectiveActionDTO;
import com.mbda.mbdhackuity.entity.TechnologyObsolescence;
import com.mbda.mbdhackuity.repository.TechnologyObsolescenceRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CorrectiveActionService {

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @Autowired
    private TechnologyObsolescenceRepository obsolescenceRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<CorrectiveActionDTO> getCorrectiveActions() {
        // Requête pour grouper par package et obtenir les infos de mise à jour
        String query = """
            SELECT 
                v.package_name as packageName,
                v.package_version as currentVersion,
                COUNT(DISTINCT v.cve_id) as cveCount,
                MAX(CASE 
                    WHEN v.base_severity = 'CRITICAL' THEN 4
                    WHEN v.base_severity = 'HIGH' THEN 3
                    WHEN v.base_severity = 'MEDIUM' THEN 2
                    WHEN v.base_severity = 'LOW' THEN 1
                    ELSE 0
                END) as severityLevel,
                MAX(v.base_severity) as maxSeverity,
                COUNT(DISTINCT v.asset_id) as affectedAssets
            FROM vulnerability_results v
            GROUP BY v.package_name, v.package_version
            HAVING COUNT(DISTINCT v.cve_id) > 0
            ORDER BY severityLevel DESC, cveCount DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createNativeQuery(query).getResultList();

        List<CorrectiveActionDTO> actions = new ArrayList<>();

        for (Object[] row : results) {
            String packageName = (String) row[0];
            String currentVersion = (String) row[1];
            Long cveCount = ((Number) row[2]).longValue();
            String maxSeverity = (String) row[4];
            Long affectedAssets = ((Number) row[5]).longValue();

            // Déterminer la catégorie basée sur le nom du package
            String category = categorizePackage(packageName);

            // Récupérer les informations d'obsolescence depuis la base
            Optional<TechnologyObsolescence> obsolescenceInfo = obsolescenceRepository.findObsoleteByTechnology(packageName);
            
            // Proposer une version cible (utiliser latestVersion si disponible)
            String targetVersion = obsolescenceInfo
                .map(TechnologyObsolescence::getLatestVersion)
                .orElse(suggestTargetVersion(packageName, currentVersion));

            CorrectiveActionDTO action = new CorrectiveActionDTO();
            action.setCategory(category);
            action.setTechnology(packageName);
            action.setDescription(getPackageDescription(packageName));
            action.setCurrentVersion(currentVersion);
            action.setTargetVersion(targetVersion);
            action.setMaxSeverity(maxSeverity);
            action.setCveCount(cveCount.intValue());
            action.setAffectedAssets(affectedAssets.intValue());
            action.setStatus("available");
            
            // Ajouter les informations d'obsolescence
            if (obsolescenceInfo.isPresent()) {
                TechnologyObsolescence obs = obsolescenceInfo.get();
                action.setIsObsolete(obs.getIsObsolete());
                action.setEndOfSupport(obs.getEndOfSupport() != null ? 
                    obs.getEndOfSupport().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : null);
                action.setEndOfLife(obs.getEndOfLife() != null ? 
                    obs.getEndOfLife().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : null);
            } else {
                action.setIsObsolete(false);
                action.setEndOfSupport(null);
                action.setEndOfLife(null);
            }

            actions.add(action);
        }

        return actions;
    }

    private String categorizePackage(String packageName) {
        if (packageName == null) return "System";
        
        String lower = packageName.toLowerCase();
        
        // OS
        if (lower.contains("windows") || lower.contains("linux") || lower.contains("ubuntu") || 
            lower.contains("debian") || lower.contains("redhat") || lower.contains("centos")) {
            return "OS";
        }
        
        // Applications
        if (lower.contains("firefox") || lower.contains("chrome") || lower.contains("edge") || 
            lower.contains("office") || lower.contains("java") || lower.contains("python")) {
            return "Application";
        }
        
        // Frameworks
        if (lower.contains("spring") || lower.contains("django") || lower.contains("react") || 
            lower.contains("angular") || lower.contains("vue") || lower.contains("express")) {
            return "Framework";
        }
        
        // Libraries
        if (lower.contains("lib") || lower.contains("commons") || lower.contains("util") ||
            lower.contains("jackson") || lower.contains("log4j") || lower.contains("gson")) {
            return "Library";
        }
        
        return "System";
    }

    private String suggestTargetVersion(String packageName, String currentVersion) {
        if (currentVersion == null || currentVersion.isEmpty()) {
            return "Dernière version";
        }

        // Vérifier d'abord dans la table obsolescence
        List<TechnologyObsolescence> allVersions = obsolescenceRepository.findByTechnologyName(packageName);
        if (!allVersions.isEmpty()) {
            // Retourner la dernière version connue
            return allVersions.stream()
                .filter(obs -> obs.getLatestVersion() != null && !obs.getLatestVersion().isEmpty())
                .map(TechnologyObsolescence::getLatestVersion)
                .findFirst()
                .orElse("Dernière version");
        }

        // Logique simplifiée de secours
        try {
            // Extraire les parties de version
            String[] parts = currentVersion.split("\\.");
            if (parts.length > 0) {
                // Incrémenter la version mineure
                int major = Integer.parseInt(parts[0].replaceAll("[^0-9]", ""));
                
                // Pour les versions critiques, suggérer un saut majeur
                if (packageName != null && (packageName.toLowerCase().contains("log4j") || 
                    packageName.toLowerCase().contains("spring"))) {
                    return (major + 1) + ".0.0";
                }
                
                return "Dernière version disponible";
            }
        } catch (Exception e) {
            // Ignore parsing errors
        }
        
        return "Dernière version";
    }

    private String getPackageDescription(String packageName) {
        if (packageName == null) return "";
        
        String lower = packageName.toLowerCase();
        
        // Descriptions courantes
        Map<String, String> descriptions = new HashMap<>();
        descriptions.put("firefox", "Navigateur web Mozilla Firefox");
        descriptions.put("chrome", "Navigateur web Google Chrome");
        descriptions.put("windows", "Système d'exploitation Microsoft");
        descriptions.put("java", "Plateforme de développement Java");
        descriptions.put("python", "Langage de programmation Python");
        descriptions.put("spring", "Framework Java Spring");
        descriptions.put("log4j", "Bibliothèque de logging Apache");
        descriptions.put("jackson", "Bibliothèque JSON pour Java");
        
        for (Map.Entry<String, String> entry : descriptions.entrySet()) {
            if (lower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        return "";
    }
}
