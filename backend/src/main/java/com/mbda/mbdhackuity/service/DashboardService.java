package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @Autowired
    private AssetRepository assetRepository;
    
    @Autowired
    private AssetService assetService;

    @PersistenceContext
    private EntityManager entityManager;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Group scans by Asset (using relatedAssetName if available, else scanName)
        Map<String, Set<String>> assetToScans = new HashMap<>();
        List<Asset> allAssets = assetRepository.findAll();
        
        for (Asset asset : allAssets) {
            String scanName = asset.getScanName();
            if (scanName == null || scanName.trim().isEmpty()) continue;
            
            String displayName = asset.getRelatedAssetName();
            if (displayName == null || displayName.trim().isEmpty()) {
                displayName = scanName;
            }
            
            assetToScans.computeIfAbsent(displayName, k -> new HashSet<>()).add(scanName);
        }

        // Collect all vulnerabilities from all assets
        Set<String> allCveIds = new HashSet<>();
        int totalVulnerabilityLines = 0;
        List<Map<String, Object>> assetStatsList = new ArrayList<>();
        
        for (Map.Entry<String, Set<String>> entry : assetToScans.entrySet()) {
            String assetName = entry.getKey();
            Set<String> scanNames = entry.getValue();
            
            if (!scanNames.isEmpty()) {
                // Count ALL vulnerability lines for this asset (without CVE deduplication)
                Long assetVulnCount = entityManager.createQuery(
                    "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.scanName IN :scanNames", Long.class)
                    .setParameter("scanNames", scanNames)
                    .getSingleResult();
                totalVulnerabilityLines += assetVulnCount.intValue();
                
                // Collect unique CVE IDs from all vulnerabilities
                @SuppressWarnings("unchecked")
                List<String> cveIds = entityManager.createQuery(
                    "SELECT DISTINCT v.cveId FROM VulnerabilityResult v WHERE v.scanName IN :scanNames")
                    .setParameter("scanNames", scanNames)
                    .getResultList();
                
                for (String cveId : cveIds) {
                    if (cveId != null && !cveId.trim().isEmpty()) {
                        allCveIds.add(cveId);
                    }
                }

                // Calculate per-asset stats for Top 10
                @SuppressWarnings("unchecked")
                List<Object[]> severityCounts = entityManager.createQuery(
                    "SELECT v.baseSeverity, COUNT(v) FROM VulnerabilityResult v WHERE v.scanName IN :scanNames GROUP BY v.baseSeverity")
                    .setParameter("scanNames", scanNames)
                    .getResultList();
                
                long assetCritical = 0;
                long assetHigh = 0;
                long assetMedium = 0;
                long assetLow = 0;
                
                for (Object[] row : severityCounts) {
                    String sev = (String) row[0];
                    Long count = (Long) row[1];
                    if (sev != null) {
                        if ("CRITICAL".equalsIgnoreCase(sev)) assetCritical = count;
                        else if ("HIGH".equalsIgnoreCase(sev)) assetHigh = count;
                        else if ("MEDIUM".equalsIgnoreCase(sev)) assetMedium = count;
                        else if ("LOW".equalsIgnoreCase(sev)) assetLow = count;
                    }
                }

                long score = (assetCritical * 10) + (assetHigh * 5) + (assetMedium * 1) + (assetLow * 1);
                
                Map<String, Object> assetStat = new HashMap<>();
                assetStat.put("assetName", assetName);
                assetStat.put("score", score);
                assetStat.put("critical", assetCritical);
                assetStat.put("high", assetHigh);
                assetStat.put("medium", assetMedium);
                assetStat.put("low", assetLow);
                assetStat.put("total", assetCritical + assetHigh + assetMedium + assetLow);
                
                assetStatsList.add(assetStat);
            }
        }
        
        // Sort by score desc and take top 10
        assetStatsList.sort((a, b) -> Long.compare((Long)b.get("score"), (Long)a.get("score")));
        stats.put("topAssets", assetStatsList.stream().limit(10).collect(Collectors.toList()));
        
        stats.put("totalCVEs", totalVulnerabilityLines);
        stats.put("uniqueCVEs", allCveIds.size());

        // Count by severity
        Long criticalCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.baseSeverity = 'CRITICAL'", Long.class)
            .getSingleResult();
        
        Long highCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.baseSeverity = 'HIGH'", Long.class)
            .getSingleResult();
        
        Long mediumCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.baseSeverity = 'MEDIUM'", Long.class)
            .getSingleResult();
        
        Long lowCount = entityManager.createQuery(
            "SELECT COUNT(v) FROM VulnerabilityResult v WHERE v.baseSeverity = 'LOW'", Long.class)
            .getSingleResult();

        stats.put("criticalCount", criticalCount);
        stats.put("highCount", highCount);
        stats.put("mediumCount", mediumCount);
        stats.put("lowCount", lowCount);

        // Percentages (use totalVulnerabilityLines for calculations)
        if (totalVulnerabilityLines > 0) {
            stats.put("criticalPercent", BigDecimal.valueOf(criticalCount * 100.0 / totalVulnerabilityLines)
                .setScale(1, RoundingMode.HALF_UP));
            stats.put("highPercent", BigDecimal.valueOf(highCount * 100.0 / totalVulnerabilityLines)
                .setScale(1, RoundingMode.HALF_UP));
        } else {
            stats.put("criticalPercent", 0);
            stats.put("highPercent", 0);
        }

        // Total scans
        Long totalScans = entityManager.createQuery(
            "SELECT COUNT(DISTINCT a.scanName) FROM Asset a", Long.class)
            .getSingleResult();
        stats.put("totalScans", totalScans);

        // Total packages
        Long totalPackages = entityManager.createQuery(
            "SELECT COUNT(DISTINCT a) FROM Asset a", Long.class)
            .getSingleResult();
        stats.put("totalPackages", totalPackages);

        // Exploits available
        Long exploitsAvailable = entityManager.createQuery(
            "SELECT COUNT(DISTINCT v.cveId) FROM VulnerabilityResult v WHERE v.exploitPocAvailable = true", Long.class)
            .getSingleResult();
        stats.put("exploitsAvailable", exploitsAvailable);

        // Severity distribution
        List<Map<String, Object>> severityDistribution = new ArrayList<>();
        severityDistribution.add(Map.of("severity", "CRITICAL", "count", criticalCount));
        severityDistribution.add(Map.of("severity", "HIGH", "count", highCount));
        severityDistribution.add(Map.of("severity", "MEDIUM", "count", mediumCount));
        severityDistribution.add(Map.of("severity", "LOW", "count", lowCount));
        stats.put("severityDistribution", severityDistribution);

        // Top 10 vulnerable packages
        String topPackagesQuery = """
            SELECT v.packageName, v.packageVersion, COUNT(DISTINCT v.cveId) as cveCount
            FROM VulnerabilityResult v
            GROUP BY v.packageName, v.packageVersion
            ORDER BY cveCount DESC
        """;
        
        @SuppressWarnings("unchecked")
        List<Object[]> topPackagesResult = entityManager.createQuery(topPackagesQuery)
            .setMaxResults(10)
            .getResultList();
        
        List<Map<String, Object>> topPackages = topPackagesResult.stream().map(row -> {
            Map<String, Object> pkg = new HashMap<>();
            pkg.put("packageName", row[0]);
            pkg.put("version", row[1]);
            pkg.put("cveCount", row[2]);
            return pkg;
        }).collect(Collectors.toList());
        stats.put("topPackages", topPackages);

        // Monthly trend (last 12 months)
        String monthlyQuery = """
            SELECT 
                TO_CHAR(v.published_date, 'Mon') as month,
                COUNT(v) as count
            FROM vulnerability_results v
            WHERE v.published_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR(v.published_date, 'Mon'), EXTRACT(MONTH FROM v.published_date)
            ORDER BY EXTRACT(MONTH FROM v.published_date)
        """;
        
        @SuppressWarnings("unchecked")
        List<Object[]> monthlyResult = entityManager.createNativeQuery(monthlyQuery)
            .getResultList();
        
        List<Map<String, Object>> monthlyTrend = monthlyResult.stream().map(row -> {
            Map<String, Object> month = new HashMap<>();
            month.put("month", row[0]);
            month.put("count", ((Number) row[1]).longValue());
            return month;
        }).collect(Collectors.toList());
        stats.put("monthlyTrend", monthlyTrend);

        // CVSS versions distribution
        String cvssVersionsQuery = """
            SELECT v.cvssVersion, COUNT(v) as count
            FROM VulnerabilityResult v
            WHERE v.cvssVersion IS NOT NULL
            GROUP BY v.cvssVersion
            ORDER BY count DESC
        """;
        
        @SuppressWarnings("unchecked")
        List<Object[]> cvssVersionsResult = entityManager.createQuery(cvssVersionsQuery)
            .getResultList();
        
        List<Map<String, Object>> cvssVersions = cvssVersionsResult.stream().map(row -> {
            Map<String, Object> version = new HashMap<>();
            version.put("version", row[0]);
            version.put("count", row[1]);
            return version;
        }).collect(Collectors.toList());
        stats.put("cvssVersions", cvssVersions);

        return stats;
    }
}
