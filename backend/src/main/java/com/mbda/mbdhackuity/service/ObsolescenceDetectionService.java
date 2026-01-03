package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.TechnologyObsolescence;
import com.mbda.mbdhackuity.repository.TechnologyObsolescenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Service de détection automatique de l'obsolescence des technologies
 * Matcher les vulnérabilités avec les technologies obsolètes référencées
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ObsolescenceDetectionService {

    private final TechnologyObsolescenceRepository obsolescenceRepository;

    /**
     * Résultat de la détection d'obsolescence
     */
    public record ObsolescenceMatch(
            boolean detected,
            String technologyName,
            String versionPattern,
            LocalDate endOfSupport,
            LocalDate endOfLife,
            String recommendation,
            String justification
    ) {}

    /**
     * Vérifie si un package est obsolète
     * 
     * @param packageName Nom du package/technologie
     * @param packageVersion Version du package
     * @return ObsolescenceMatch contenant les informations d'obsolescence si détecté
     */
    public ObsolescenceMatch checkObsolescence(String packageName, String packageVersion) {
        if (packageName == null || packageName.trim().isEmpty()) {
            return new ObsolescenceMatch(false, null, null, null, null, null, null);
        }

        // Récupérer toutes les technologies obsolètes
        List<TechnologyObsolescence> obsoleteTechnologies = obsolescenceRepository.findByIsObsolete(true);

        for (TechnologyObsolescence tech : obsoleteTechnologies) {
            // Vérifier si le nom de la technologie correspond
            if (matchesTechnologyName(packageName, tech.getTechnologyName())) {
                // Vérifier si la version correspond au pattern
                if (matchesVersionPattern(packageVersion, tech.getVersionPattern())) {
                    log.debug("🚫 Obsolescence detected: {} {} matches {} ({})",
                            packageName, packageVersion, tech.getTechnologyName(), tech.getVersionPattern());
                    
                    return new ObsolescenceMatch(
                            true,
                            tech.getTechnologyName(),
                            tech.getVersionPattern(),
                            tech.getEndOfSupport(),
                            tech.getEndOfLife(),
                            tech.getReplacementRecommendation(),
                            tech.getJustification()
                    );
                }
            }
        }

        return new ObsolescenceMatch(false, null, null, null, null, null, null);
    }

    /**
     * Vérifie si un nom de package correspond à une technologie obsolète
     * Matching flexible : insensible à la casse et aux variations courantes
     */
    private boolean matchesTechnologyName(String packageName, String technologyName) {
        if (technologyName == null || technologyName.trim().isEmpty()) {
            return false;
        }

        String normalizedPackage = normalizePackageName(packageName);
        String normalizedTech = normalizePackageName(technologyName);

        // Match exact
        if (normalizedPackage.equals(normalizedTech)) {
            return true;
        }

        // Match si le nom de package contient la technologie
        if (normalizedPackage.contains(normalizedTech)) {
            return true;
        }

        // Match si la technologie contient le nom de package
        if (normalizedTech.contains(normalizedPackage)) {
            return true;
        }

        // Match sur les variations courantes (ex: "nodejs" vs "node.js" vs "node")
        String[] techVariants = generateNameVariants(normalizedTech);
        for (String variant : techVariants) {
            if (normalizedPackage.contains(variant) || variant.contains(normalizedPackage)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normalise un nom de package pour la comparaison
     */
    private String normalizePackageName(String name) {
        if (name == null) {
            return "";
        }
        
        return name.toLowerCase()
                .replaceAll("[_\\-\\.]", "") // Supprimer séparateurs
                .replaceAll("\\s+", "")      // Supprimer espaces
                .trim();
    }

    /**
     * Génère des variantes de nom pour améliorer le matching
     */
    private String[] generateNameVariants(String name) {
        String base = name.replaceAll("[_\\-\\.]", "");
        return new String[]{
                base,
                name.replaceAll("\\.", ""),
                name.replaceAll("-", ""),
                name.replaceAll("_", "")
        };
    }

    /**
     * Vérifie si une version correspond à un pattern d'obsolescence
     * 
     * Patterns supportés:
     * - null ou vide : toutes les versions
     * - "1.x" : toutes les versions 1.x
     * - "1.*" : toutes les versions 1.x
     * - "< 2.0" : versions inférieures à 2.0
     * - "<= 1.9" : versions inférieures ou égales à 1.9
     * - "1.2.3" : version exacte
     */
    private boolean matchesVersionPattern(String version, String pattern) {
        if (pattern == null || pattern.trim().isEmpty()) {
            // Pas de pattern = toutes les versions sont concernées
            return true;
        }

        if (version == null || version.trim().isEmpty()) {
            return false;
        }

        String normalizedPattern = pattern.trim().toLowerCase();
        String normalizedVersion = version.trim().toLowerCase();

        // Pattern wildcard (1.x, 1.*, etc.)
        if (normalizedPattern.contains("x") || normalizedPattern.contains("*")) {
            String versionPrefix = normalizedPattern
                    .replaceAll("[x*].*$", "")  // Supprimer le wildcard et ce qui suit
                    .replaceAll("[.\\-]$", ""); // Supprimer le dernier séparateur
            
            return normalizedVersion.startsWith(versionPrefix);
        }

        // Pattern de comparaison (< 2.0, <= 1.9, etc.)
        if (normalizedPattern.startsWith("<") || normalizedPattern.startsWith(">")) {
            return matchesComparisonPattern(normalizedVersion, normalizedPattern);
        }

        // Match exact
        return normalizedVersion.equals(normalizedPattern);
    }

    /**
     * Vérifie si une version correspond à un pattern de comparaison (< 2.0, <= 1.9, etc.)
     */
    private boolean matchesComparisonPattern(String version, String pattern) {
        try {
            boolean orEqual = pattern.startsWith("<=") || pattern.startsWith(">=");
            boolean lessThan = pattern.startsWith("<");
            
            String targetVersion = pattern
                    .replaceAll("^[<>=]+\\s*", "")
                    .trim();

            int comparison = compareVersions(version, targetVersion);

            if (lessThan && orEqual) {
                return comparison <= 0;
            } else if (lessThan) {
                return comparison < 0;
            } else if (orEqual) {
                return comparison >= 0;
            } else {
                return comparison > 0;
            }
        } catch (Exception e) {
            log.warn("Failed to parse comparison pattern: {} for version {}", pattern, version, e);
            return false;
        }
    }

    /**
     * Compare deux versions (simplifiée)
     * Retourne: -1 si v1 < v2, 0 si égales, 1 si v1 > v2
     */
    private int compareVersions(String v1, String v2) {
        String[] parts1 = v1.split("[.\\-]");
        String[] parts2 = v2.split("[.\\-]");

        int maxLength = Math.max(parts1.length, parts2.length);

        for (int i = 0; i < maxLength; i++) {
            int num1 = i < parts1.length ? parseVersionPart(parts1[i]) : 0;
            int num2 = i < parts2.length ? parseVersionPart(parts2[i]) : 0;

            if (num1 < num2) {
                return -1;
            } else if (num1 > num2) {
                return 1;
            }
        }

        return 0;
    }

    /**
     * Parse une partie de version en nombre
     */
    private int parseVersionPart(String part) {
        try {
            // Extraire uniquement les chiffres au début
            String digits = part.replaceAll("^(\\d+).*", "$1");
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Formate les informations d'obsolescence pour stockage
     */
    public String formatObsolescenceInfo(ObsolescenceMatch match) {
        if (!match.detected()) {
            return null;
        }

        StringBuilder info = new StringBuilder();
        info.append("Technologie: ").append(match.technologyName());
        
        if (match.versionPattern() != null && !match.versionPattern().isEmpty()) {
            info.append(" (").append(match.versionPattern()).append(")");
        }

        if (match.endOfSupport() != null) {
            info.append(" | Fin de support: ").append(match.endOfSupport());
        }

        if (match.endOfLife() != null) {
            info.append(" | Fin de vie: ").append(match.endOfLife());
        }

        if (match.recommendation() != null && !match.recommendation().isEmpty()) {
            info.append(" | Recommandation: ").append(match.recommendation());
        }

        if (match.justification() != null && !match.justification().isEmpty()) {
            info.append(" | Justification: ").append(match.justification());
        }

        return info.toString();
    }
}
