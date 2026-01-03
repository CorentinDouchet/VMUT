package com.mbda.mbdhackuity.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;

import java.util.*;
import java.time.LocalDateTime;

@Service
public class StatsService {

    @PersistenceContext
    private EntityManager entityManager;

    public Map<String, Object> getGlobalStats() {
        // Total CVEs
        Long total = entityManager.createQuery("SELECT COUNT(c) FROM Cve c", Long.class)
            .getSingleResult();

        // Par sévérité
        String severityQuery = """
            SELECT 
                c.baseSeverity,
                COUNT(c),
                CAST(COUNT(c) * 100.0 / :total AS double)
            FROM Cve c
            WHERE c.baseSeverity IS NOT NULL
            GROUP BY c.baseSeverity
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> severityResults = entityManager.createQuery(severityQuery)
            .setParameter("total", total)
            .getResultList();

        Map<String, Map<String, Object>> bySeverity = new HashMap<>();
        for (Object[] row : severityResults) {
            Map<String, Object> severityData = new HashMap<>();
            severityData.put("count", row[1]);
            severityData.put("percentage", row[2]);
            bySeverity.put((String) row[0], severityData);
        }

        // Par version CVSS
        String cvssQuery = """
            SELECT c.cvssVersion, COUNT(c)
            FROM Cve c
            WHERE c.cvssVersion IS NOT NULL
            GROUP BY c.cvssVersion
            ORDER BY c.cvssVersion DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> cvssResults = entityManager.createQuery(cvssQuery).getResultList();

        Map<String, Long> byCvssVersion = new HashMap<>();
        for (Object[] row : cvssResults) {
            byCvssVersion.put((String) row[0], (Long) row[1]);
        }

        // Par période
        String periodQuery = """
            SELECT
                COUNT(CASE WHEN c.published >= CURRENT_DATE - 7 THEN 1 END),
                COUNT(CASE WHEN c.published >= CURRENT_DATE - 30 THEN 1 END),
                COUNT(CASE WHEN c.published >= CURRENT_DATE - 365 THEN 1 END)
            FROM Cve c
        """;

        Object[] periodResult = (Object[]) entityManager.createQuery(periodQuery)
            .getSingleResult();

        Map<String, Long> byPeriod = new HashMap<>();
        byPeriod.put("week", (Long) periodResult[0]);
        byPeriod.put("month", (Long) periodResult[1]);
        byPeriod.put("year", (Long) periodResult[2]);

        // Distribution des scores
        String scoreQuery = """
            SELECT
                CASE
                    WHEN c.baseScore >= 9.0 THEN '9.0-10.0'
                    WHEN c.baseScore >= 7.0 THEN '7.0-8.9'
                    WHEN c.baseScore >= 4.0 THEN '4.0-6.9'
                    WHEN c.baseScore >= 0.1 THEN '0.1-3.9'
                    ELSE 'N/A'
                END,
                COUNT(c)
            FROM Cve c
            GROUP BY 
                CASE
                    WHEN c.baseScore >= 9.0 THEN '9.0-10.0'
                    WHEN c.baseScore >= 7.0 THEN '7.0-8.9'
                    WHEN c.baseScore >= 4.0 THEN '4.0-6.9'
                    WHEN c.baseScore >= 0.1 THEN '0.1-3.9'
                    ELSE 'N/A'
                END
            ORDER BY 1 DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> scoreResults = entityManager.createQuery(scoreQuery).getResultList();

        List<Map<String, Object>> scoreDistribution = new ArrayList<>();
        for (Object[] row : scoreResults) {
            Map<String, Object> range = new HashMap<>();
            range.put("score_range", row[0]);
            range.put("count", row[1]);
            scoreDistribution.add(range);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("bySeverity", bySeverity);
        stats.put("byCvssVersion", byCvssVersion);
        stats.put("byPeriod", byPeriod);
        stats.put("scoreDistribution", scoreDistribution);

        return stats;
    }

    public List<Map<String, Object>> getTrends() {
        String query = """
            SELECT
                FUNCTION('DATE_TRUNC', 'month', c.published),
                COUNT(c),
                COUNT(CASE WHEN c.baseSeverity = 'CRITICAL' THEN 1 END),
                COUNT(CASE WHEN c.baseSeverity = 'HIGH' THEN 1 END),
                COUNT(CASE WHEN c.baseSeverity = 'MEDIUM' THEN 1 END),
                COUNT(CASE WHEN c.baseSeverity = 'LOW' THEN 1 END)
            FROM Cve c
            WHERE c.published >= CURRENT_DATE - 365
            GROUP BY FUNCTION('DATE_TRUNC', 'month', c.published)
            ORDER BY 1 DESC
        """;

        @SuppressWarnings("unchecked")
        List<Object[]> results = entityManager.createQuery(query).getResultList();

        List<Map<String, Object>> trends = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> trend = new HashMap<>();
            trend.put("month", row[0]);
            trend.put("count", row[1]);
            trend.put("critical", row[2]);
            trend.put("high", row[3]);
            trend.put("medium", row[4]);
            trend.put("low", row[5]);
            trends.add(trend);
        }

        return trends;
    }

    /**
     * Tableau de bord basé sur les vulnérabilités consolidées (tous assets).
     */
    public Map<String, Object> getVulnerabilitiesDashboard() {
        Map<String, Object> data = new HashMap<>();

        Long total = entityManager.createQuery(
                "SELECT COUNT(v) FROM VulnerabilityResult v", Long.class)
            .getSingleResult();

        Long assetsCount = entityManager.createQuery(
                "SELECT COUNT(DISTINCT v.scanName) FROM VulnerabilityResult v", Long.class)
            .getSingleResult();

        // Répartition par sévérité
        List<Object[]> severityRows = entityManager.createQuery(
                "SELECT COALESCE(v.baseSeverity,'UNKNOWN'), COUNT(v) " +
                "FROM VulnerabilityResult v GROUP BY COALESCE(v.baseSeverity,'UNKNOWN')",
                Object[].class).getResultList();

        Map<String, Long> severityCounts = new HashMap<>();
        for (Object[] row : severityRows) {
            severityCounts.put((String) row[0], (Long) row[1]);
        }

        // Top 10 assets critiques
        List<Object[]> topAssetsRows = entityManager.createQuery(
                "SELECT v.scanName, " +
                "SUM(CASE WHEN v.baseSeverity='CRITICAL' THEN 1 ELSE 0 END), " +
                "SUM(CASE WHEN v.baseSeverity='HIGH' THEN 1 ELSE 0 END), " +
                "SUM(CASE WHEN v.baseSeverity='MEDIUM' THEN 1 ELSE 0 END), " +
                "SUM(CASE WHEN v.baseSeverity='LOW' THEN 1 ELSE 0 END), " +
                "COUNT(v) " +
                "FROM VulnerabilityResult v " +
                "GROUP BY v.scanName " +
                "ORDER BY SUM(CASE WHEN v.baseSeverity='CRITICAL' THEN 1 ELSE 0 END) DESC",
                Object[].class)
            .setMaxResults(10)
            .getResultList();

        List<Map<String, Object>> topAssets = new ArrayList<>();
        for (Object[] row : topAssetsRows) {
            Map<String, Object> item = new HashMap<>();
            item.put("asset", (String) row[0]);
            item.put("critical", ((Number) row[1]).longValue());
            item.put("high", ((Number) row[2]).longValue());
            item.put("medium", ((Number) row[3]).longValue());
            item.put("low", ((Number) row[4]).longValue());
            item.put("total", ((Number) row[5]).longValue());
            topAssets.add(item);
        }

        // Top 10 CVE les plus répandues
        List<Object[]> topCveRows = entityManager.createQuery(
                "SELECT v.cveId, COUNT(v) " +
                "FROM VulnerabilityResult v " +
                "WHERE v.cveId IS NOT NULL " +
                "GROUP BY v.cveId " +
                "ORDER BY COUNT(v) DESC",
                Object[].class)
            .setMaxResults(10)
            .getResultList();

        List<Map<String, Object>> topCves = new ArrayList<>();
        for (Object[] row : topCveRows) {
            Map<String, Object> item = new HashMap<>();
            item.put("cveId", (String) row[0]);
            item.put("count", ((Number) row[1]).longValue());
            topCves.add(item);
        }

        // Tendances simples (dernières 8 semaines)
        List<Object[]> trendRows = entityManager.createQuery(
                "SELECT FUNCTION('DATE_TRUNC','week', v.publishedDate), COUNT(v) " +
                "FROM VulnerabilityResult v " +
                "WHERE v.publishedDate IS NOT NULL " +
                "GROUP BY FUNCTION('DATE_TRUNC','week', v.publishedDate) " +
                "ORDER BY FUNCTION('DATE_TRUNC','week', v.publishedDate) DESC",
                Object[].class)
            .setMaxResults(8)
            .getResultList();

        List<Map<String, Object>> trends = new ArrayList<>();
        for (Object[] row : trendRows) {
            Map<String, Object> t = new HashMap<>();
            t.put("week", row[0]);
            t.put("count", ((Number) row[1]).longValue());
            trends.add(t);
        }
        Collections.reverse(trends); // plus ancien -> plus récent

        data.put("totalFindings", total);
        data.put("assetsCount", assetsCount);
        data.put("severityCounts", severityCounts);
        data.put("topAssets", topAssets);
        data.put("topCves", topCves);
        data.put("trends", trends);

        // Scores synthétiques
        long critical = severityCounts.getOrDefault("CRITICAL", 0L);
        long high = severityCounts.getOrDefault("HIGH", 0L);
        long medium = severityCounts.getOrDefault("MEDIUM", 0L);
        long low = severityCounts.getOrDefault("LOW", 0L);
        long score = critical * 10 + high * 6 + medium * 3 + low;
        data.put("overallScore", score);

        return data;
    }
}