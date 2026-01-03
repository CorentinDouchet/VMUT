package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.CveDTO;
import com.mbda.mbdhackuity.dto.PageResponse;
import com.mbda.mbdhackuity.entity.Cve;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.CveRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CveService {

    @Autowired
    private CveRepository cveRepository;

    @Autowired
    private VulnerabilityResultRepository vulnerabilityResultRepository;

    @PersistenceContext
    private EntityManager entityManager;

    // Années disponibles
    public List<Integer> getAvailableYears() {
        // Extract year from CVE ID (e.g., CVE-2025-xxxx)
        String query = "SELECT DISTINCT SUBSTRING(c.cveId, 5, 4) FROM Cve c WHERE c.cveId IS NOT NULL ORDER BY 1 DESC";
        List<String> years = entityManager.createQuery(query, String.class).getResultList();
        // Convert to Integer and filter valid years
        return years.stream()
            .filter(y -> y.matches("\\d{4}"))
            .map(Integer::parseInt)
            .sorted(Comparator.reverseOrder())
            .collect(Collectors.toList());
    }

    // Versions CVSS disponibles
    public List<String> getCvssVersions() {
        String query = "SELECT DISTINCT c.cvssVersion FROM Cve c WHERE c.cvssVersion IS NOT NULL ORDER BY c.cvssVersion DESC";
        return entityManager.createQuery(query, String.class).getResultList();
    }

    // Statuts disponibles
    public List<String> getStatuses() {
        String query = "SELECT DISTINCT c.vulnStatus FROM Cve c WHERE c.vulnStatus IS NOT NULL ORDER BY c.vulnStatus";
        return entityManager.createQuery(query, String.class).getResultList();
    }

    // Scores disponibles (triés du plus haut au plus bas)
    public List<BigDecimal> getAvailableScores() {
        String query = "SELECT DISTINCT c.baseScore FROM Cve c WHERE c.baseScore IS NOT NULL ORDER BY c.baseScore DESC";
        return entityManager.createQuery(query, BigDecimal.class).getResultList();
    }

    // Statistiques
    public Map<String, Object> getStats(String year) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Object[]> query = cb.createQuery(Object[].class);
        Root<Cve> root = query.from(Cve.class);

        List<Predicate> predicates = new ArrayList<>();
        if (year != null && !year.equals("all")) {
            // Filter by year in CVE ID (positions 5-8)
            predicates.add(cb.equal(cb.substring(root.get("cveId"), 5, 4), year));
        }

        query.multiselect(
            cb.count(root),
            cb.sum(cb.<Long>selectCase()
                .when(cb.equal(root.get("baseSeverity"), "CRITICAL"), 1L)
                .otherwise(0L)),
            cb.sum(cb.<Long>selectCase()
                .when(cb.equal(root.get("baseSeverity"), "HIGH"), 1L)
                .otherwise(0L)),
            cb.sum(cb.<Long>selectCase()
                .when(cb.equal(root.get("baseSeverity"), "MEDIUM"), 1L)
                .otherwise(0L)),
            cb.sum(cb.<Long>selectCase()
                .when(cb.equal(root.get("baseSeverity"), "LOW"), 1L)
                .otherwise(0L)),
            cb.sum(cb.<Long>selectCase()
                .when(cb.isNotNull(root.get("cpeCriteria")), 1L)
                .otherwise(0L))
        );

        if (!predicates.isEmpty()) {
            query.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        Object[] result = entityManager.createQuery(query).getSingleResult();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", result[0]);
        stats.put("critical", result[1]);
        stats.put("high", result[2]);
        stats.put("medium", result[3]);
        stats.put("low", result[4]);
        stats.put("with_cpe", result[5]);

        return stats;
    }

    // Liste CVEs avec filtres (enhanced version with new filters)
    public PageResponse<CveDTO> getCvesWithFilters(
            String year, String severity, String search, String cveId, 
            String status, String cvssVersion, BigDecimal scoreMin, 
            BigDecimal scoreMax, BigDecimal score, String cpe, 
            String keyword, String publishedStart, String publishedEnd,
            String modifiedStart, String modifiedEnd, String attackVector,
            String attackComplexity, String privilegesRequired, 
            String userInteraction, String cwe,
            int page, int limit, String sortBy, String sortOrder) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Requête de comptage
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Cve> countRoot = countQuery.from(Cve.class);
        countQuery.select(cb.count(countRoot));
        
        List<Predicate> countPredicates = buildPredicates(cb, countRoot, year, severity, 
            search, cveId, status, cvssVersion, scoreMin, scoreMax, score, cpe,
            keyword, publishedStart, publishedEnd, modifiedStart, modifiedEnd,
            attackVector, attackComplexity, privilegesRequired, userInteraction, cwe);
        
        if (!countPredicates.isEmpty()) {
            countQuery.where(cb.and(countPredicates.toArray(new Predicate[0])));
        }
        
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        // Requête de données
        CriteriaQuery<Cve> dataQuery = cb.createQuery(Cve.class);
        Root<Cve> dataRoot = dataQuery.from(Cve.class);
        
        List<Predicate> dataPredicates = buildPredicates(cb, dataRoot, year, severity, 
            search, cveId, status, cvssVersion, scoreMin, scoreMax, score, cpe,
            keyword, publishedStart, publishedEnd, modifiedStart, modifiedEnd,
            attackVector, attackComplexity, privilegesRequired, userInteraction, cwe);
        
        if (!dataPredicates.isEmpty()) {
            dataQuery.where(cb.and(dataPredicates.toArray(new Predicate[0])));
        }

        // Tri
        Order order = sortOrder.equalsIgnoreCase("asc") 
            ? cb.asc(dataRoot.get(sortBy))
            : cb.desc(dataRoot.get(sortBy));
        dataQuery.orderBy(order);

        TypedQuery<Cve> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((page - 1) * limit);
        typedQuery.setMaxResults(limit);

        List<Cve> cves = typedQuery.getResultList();
        List<CveDTO> cveDTOs = cves.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());

        PageResponse<CveDTO> response = new PageResponse<>();
        response.setData(cveDTOs);
        
        PageResponse.Pagination pagination = new PageResponse.Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
        pagination.setTotal(total);
        pagination.setTotalPages((long) Math.ceil((double) total / limit));
        response.setPagination(pagination);

        return response;
    }

    private List<Predicate> buildPredicates(CriteriaBuilder cb, Root<Cve> root,
            String year, String severity, String search, String cveId, 
            String status, String cvssVersion, BigDecimal scoreMin, 
            BigDecimal scoreMax, BigDecimal score, String cpe,
            String keyword, String publishedStart, String publishedEnd,
            String modifiedStart, String modifiedEnd, String attackVector,
            String attackComplexity, String privilegesRequired, 
            String userInteraction, String cwe) {

        List<Predicate> predicates = new ArrayList<>();

        if (cveId != null && !cveId.isEmpty()) {
            predicates.add(cb.like(cb.lower(root.get("cveId")), 
                "%" + cveId.toLowerCase() + "%"));
        }

        if (year != null && !year.equals("all")) {
            // Filter by year in CVE ID (positions 5-8)
            predicates.add(cb.equal(cb.substring(root.get("cveId"), 5, 4), year));
        }

        if (severity != null && !severity.equals("all")) {
            predicates.add(cb.equal(root.get("baseSeverity"), severity));
        }
        
        if (cpe != null && !cpe.isEmpty()) {
            predicates.add(cb.like(cb.lower(root.get("cpeCriteria")), 
                "%" + cpe.toLowerCase() + "%"));
        }

        if (score != null) {
            predicates.add(cb.equal(root.get("baseScore"), score));
        }

        if (scoreMin != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("baseScore"), scoreMin));
        }

        if (scoreMax != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("baseScore"), scoreMax));
        }

        if (cvssVersion != null && !cvssVersion.equals("all")) {
            predicates.add(cb.equal(root.get("cvssVersion"), cvssVersion));
        }

        if (search != null && !search.isEmpty()) {
            predicates.add(cb.like(cb.lower(root.get("description")), 
                "%" + search.toLowerCase() + "%"));
        }

        if (status != null && !status.equals("all")) {
            predicates.add(cb.equal(root.get("vulnStatus"), status));
        }

        // NEW FILTERS
        if (keyword != null && !keyword.isEmpty()) {
            predicates.add(cb.like(cb.lower(root.get("description")), 
                "%" + keyword.toLowerCase() + "%"));
        }

        if (publishedStart != null && !publishedStart.isEmpty()) {
            try {
                LocalDateTime startDate = LocalDateTime.parse(publishedStart + "T00:00:00");
                predicates.add(cb.greaterThanOrEqualTo(root.get("published"), startDate));
            } catch (Exception e) {
                // Invalid date format, skip filter
            }
        }

        if (publishedEnd != null && !publishedEnd.isEmpty()) {
            try {
                LocalDateTime endDate = LocalDateTime.parse(publishedEnd + "T23:59:59");
                predicates.add(cb.lessThanOrEqualTo(root.get("published"), endDate));
            } catch (Exception e) {
                // Invalid date format, skip filter
            }
        }

        if (modifiedStart != null && !modifiedStart.isEmpty()) {
            try {
                LocalDateTime startDate = LocalDateTime.parse(modifiedStart + "T00:00:00");
                predicates.add(cb.greaterThanOrEqualTo(root.get("lastModified"), startDate));
            } catch (Exception e) {
                // Invalid date format, skip filter
            }
        }

        if (modifiedEnd != null && !modifiedEnd.isEmpty()) {
            try {
                LocalDateTime endDate = LocalDateTime.parse(modifiedEnd + "T23:59:59");
                predicates.add(cb.lessThanOrEqualTo(root.get("lastModified"), endDate));
            } catch (Exception e) {
                // Invalid date format, skip filter
            }
        }

        // CVSS Metric filters - extract from vectorString
        if (attackVector != null && !attackVector.isEmpty()) {
            predicates.add(cb.like(root.get("vectorString"), "%AV:" + attackVector + "%"));
        }

        if (attackComplexity != null && !attackComplexity.isEmpty()) {
            predicates.add(cb.like(root.get("vectorString"), "%AC:" + attackComplexity + "%"));
        }

        if (privilegesRequired != null && !privilegesRequired.isEmpty()) {
            predicates.add(cb.like(root.get("vectorString"), "%PR:" + privilegesRequired + "%"));
        }

        if (userInteraction != null && !userInteraction.isEmpty()) {
            predicates.add(cb.like(root.get("vectorString"), "%UI:" + userInteraction + "%"));
        }

        if (cwe != null && !cwe.isEmpty()) {
            // CWE is stored in description or rawData (JSON), search both
            Predicate cweInDescription = cb.like(cb.lower(root.get("description")), 
                "%" + cwe.toLowerCase() + "%");
            Predicate cweInRawData = cb.like(cb.lower(root.get("rawData")), 
                "%" + cwe.toLowerCase() + "%");
            predicates.add(cb.or(cweInDescription, cweInRawData));
        }

        return predicates;
    }

    // Export CVEs to CSV (all matching without pagination)
    public List<CveDTO> exportCves(
            String year, String severity, String search, String cveId, 
            String status, String cvssVersion, BigDecimal scoreMin, 
            BigDecimal scoreMax, BigDecimal score, String cpe,
            String keyword, String publishedStart, String publishedEnd,
            String modifiedStart, String modifiedEnd, String attackVector,
            String attackComplexity, String privilegesRequired, 
            String userInteraction, String cwe) {

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Cve> dataQuery = cb.createQuery(Cve.class);
        Root<Cve> dataRoot = dataQuery.from(Cve.class);
        
        List<Predicate> dataPredicates = buildPredicates(cb, dataRoot, year, severity, 
            search, cveId, status, cvssVersion, scoreMin, scoreMax, score, cpe,
            keyword, publishedStart, publishedEnd, modifiedStart, modifiedEnd,
            attackVector, attackComplexity, privilegesRequired, userInteraction, cwe);
        
        if (!dataPredicates.isEmpty()) {
            dataQuery.where(cb.and(dataPredicates.toArray(new Predicate[0])));
        }

        // Default sort by published date desc
        dataQuery.orderBy(cb.desc(dataRoot.get("published")));

        List<Cve> cves = entityManager.createQuery(dataQuery).getResultList();
        return cves.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    // Get distinct Attack Vector values from vectorString
    public List<String> getAttackVectors() {
        String query = "SELECT DISTINCT c.vectorString FROM Cve c WHERE c.vectorString IS NOT NULL";
        List<String> vectors = entityManager.createQuery(query, String.class).getResultList();
        
        Set<String> attackVectors = new HashSet<>();
        for (String vector : vectors) {
            // Extract AV: value from CVSS vector string
            // Format: CVSS:3.1/AV:N/AC:L/...
            if (vector != null && vector.contains("AV:")) {
                String av = extractMetric(vector, "AV");
                if (av != null) {
                    attackVectors.add(av);
                }
            }
        }
        
        return new ArrayList<>(attackVectors);
    }

    // Get distinct Attack Complexity values
    public List<String> getAttackComplexities() {
        String query = "SELECT DISTINCT c.vectorString FROM Cve c WHERE c.vectorString IS NOT NULL";
        List<String> vectors = entityManager.createQuery(query, String.class).getResultList();
        
        Set<String> complexities = new HashSet<>();
        for (String vector : vectors) {
            if (vector != null && vector.contains("AC:")) {
                String ac = extractMetric(vector, "AC");
                if (ac != null) {
                    complexities.add(ac);
                }
            }
        }
        
        return new ArrayList<>(complexities);
    }

    // Get distinct Privileges Required values
    public List<String> getPrivilegesRequired() {
        String query = "SELECT DISTINCT c.vectorString FROM Cve c WHERE c.vectorString IS NOT NULL";
        List<String> vectors = entityManager.createQuery(query, String.class).getResultList();
        
        Set<String> privileges = new HashSet<>();
        for (String vector : vectors) {
            if (vector != null && vector.contains("PR:")) {
                String pr = extractMetric(vector, "PR");
                if (pr != null) {
                    privileges.add(pr);
                }
            }
        }
        
        return new ArrayList<>(privileges);
    }

    // Get distinct User Interaction values
    public List<String> getUserInteractions() {
        String query = "SELECT DISTINCT c.vectorString FROM Cve c WHERE c.vectorString IS NOT NULL";
        List<String> vectors = entityManager.createQuery(query, String.class).getResultList();
        
        Set<String> interactions = new HashSet<>();
        for (String vector : vectors) {
            if (vector != null && vector.contains("UI:")) {
                String ui = extractMetric(vector, "UI");
                if (ui != null) {
                    interactions.add(ui);
                }
            }
        }
        
        return new ArrayList<>(interactions);
    }

    // Get distinct CWE identifiers from descriptions and rawData
    public List<String> getCWEs() {
        String query = "SELECT DISTINCT c.description FROM Cve c WHERE c.description LIKE '%CWE-%'";
        List<String> descriptions = entityManager.createQuery(query, String.class)
            .setMaxResults(1000) // Limit to avoid processing too much data
            .getResultList();
        
        Set<String> cwes = new HashSet<>();
        for (String desc : descriptions) {
            if (desc != null) {
                // Extract CWE-XXX patterns
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("CWE-\\d+");
                java.util.regex.Matcher matcher = pattern.matcher(desc);
                while (matcher.find()) {
                    cwes.add(matcher.group());
                }
            }
        }
        
        return new ArrayList<>(cwes).stream()
            .sorted()
            .limit(100) // Return top 100 CWEs
            .collect(Collectors.toList());
    }

    // Helper method to extract CVSS metric from vector string
    private String extractMetric(String vectorString, String metric) {
        if (vectorString == null || !vectorString.contains(metric + ":")) {
            return null;
        }
        
        try {
            int start = vectorString.indexOf(metric + ":") + metric.length() + 1;
            int end = vectorString.indexOf("/", start);
            if (end == -1) {
                end = vectorString.length();
            }
            return vectorString.substring(start, end);
        } catch (Exception e) {
            return null;
        }
    }

    private CveDTO convertToDTO(Cve cve) {
        CveDTO dto = new CveDTO();
        dto.setCveId(cve.getCveId());
        dto.setPublished(cve.getPublished());
        dto.setLastModified(cve.getLastModified());
        dto.setBaseScore(cve.getBaseScore());
        dto.setBaseSeverity(cve.getBaseSeverity());
        dto.setCvssVersion(cve.getCvssVersion());
        dto.setDescription(cve.getDescription());
        dto.setVulnStatus(cve.getVulnStatus());
        // CPE criteria is stored as JSON string, skip conversion for now
        return dto;
    }

    public Optional<Cve> getCveByCveId(String cveId) {
        return cveRepository.findByCveId(cveId);
    }

    public Map<String, Object> getCveDetails(String cveId) {
        // Get CVE information from encyclopedia
        Optional<Cve> cveOpt = cveRepository.findByCveId(cveId);
        if (cveOpt.isEmpty()) {
            throw new RuntimeException("CVE not found: " + cveId);
        }
        
        Cve cve = cveOpt.get();
        
        // Convert to map matching frontend expectations (CVEDetail.jsx)
        Map<String, Object> cveData = new HashMap<>();
        cveData.put("cveId", cve.getCveId());
        cveData.put("sourceIdentifier", cve.getSourceIdentifier());
        cveData.put("published", cve.getPublished());
        cveData.put("lastModified", cve.getLastModified());
        cveData.put("vulnStatus", cve.getVulnStatus());
        cveData.put("description", cve.getDescription());
        cveData.put("baseScore", cve.getBaseScore());
        cveData.put("baseSeverity", cve.getBaseSeverity());
        cveData.put("vectorString", cve.getVectorString());
        cveData.put("cvssVersion", cve.getCvssVersion());
        cveData.put("cpeCriteria", cve.getCpeCriteria());
        cveData.put("cveReferences", cve.getCveReferences());
        cveData.put("rawData", cve.getRawData());
        
        // New NIST fields
        cveData.put("cwes", cve.getCwes());
        cveData.put("assigner", cve.getAssigner());
        cveData.put("changeHistory", cve.getChangeHistory());
        
        return cveData;
    }
}