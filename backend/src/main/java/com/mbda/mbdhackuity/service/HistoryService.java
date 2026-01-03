package com.mbda.mbdhackuity.service;

import jakarta.persistence.criteria.Expression;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mbda.mbdhackuity.dto.CveJustificationRequest;
import com.mbda.mbdhackuity.dto.PageResponse;
import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.CveJustificationHistory;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.CveJustificationHistoryRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HistoryService {

    @Autowired
    private CveJustificationHistoryRepository historyRepository;
    
    @Autowired
    private VulnerabilityResultRepository vulnerabilityRepository;
    
    @Autowired
    private AssetRepository assetRepository;

    @PersistenceContext
    private EntityManager entityManager;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Map<String, Object> addCveToHistory(CveJustificationRequest request) {
        Optional<CveJustificationHistory> existing = 
            historyRepository.findByCveId(request.getCveId());

        if (existing.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "CVE déjà dans l'historique");
            response.put("existing", true);
            response.put("id", existing.get().getId());
            return response;
        }

        CveJustificationHistory history = new CveJustificationHistory();
        history.setCveId(request.getCveId());
        history.setPackageName(request.getPackageName());
        history.setPackageVersion(request.getPackageVersion());
        history.setCveDescription(request.getCveDescription());
        history.setBaseScore(request.getBaseScore());
        history.setBaseSeverity(request.getBaseSeverity());
        history.setVersionCvss(request.getVersionCvss());
        history.setTechnologiesAffectees(request.getTechnologiesAffectees());
        history.setCpeCriteria(request.getCpeCriteria());
        history.setCwe(request.getCwe());
        history.setExploitPoc(request.getExploitPoc());
        history.setExploitReferences(request.getExploitReferences());
        history.setCommentsAnalyst(request.getCommentsAnalyst());
        history.setCommentsValidator(request.getCommentsValidator());
        history.setFirstScanName(request.getScanName());
        history.setVectorString(request.getVectorString());
        history.setPublishedDate(request.getPublishedDate());
        history.setLastModifiedDate(request.getLastModifiedDate());
        history.setJustifiedDate(LocalDateTime.now());

        CveJustificationHistory saved = historyRepository.save(history);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "CVE ajoutée à l'historique");
        response.put("existing", false);
        response.put("data", saved);
        return response;
    }

    public PageResponse<CveJustificationHistory> getJustifiedCves(
            String cveId, String packageName, String severity, String year, Long assetId,
            int page, int limit, String sortBy, String sortOrder) {

        Sort.Direction direction = sortOrder.equalsIgnoreCase("asc") 
            ? Sort.Direction.ASC 
            : Sort.Direction.DESC;
        
        PageRequest pageRequest = PageRequest.of(page - 1, limit, Sort.by(direction, sortBy.equals("justifiedDate") ? "id" : sortBy));

        // Query vulnerability_results WHERE comments_analyst IS NOT NULL
        Page<VulnerabilityResult> vulnResults = vulnerabilityRepository.findAll(
            (root, query, cb) -> {
                List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

                // MUST have comments
                predicates.add(cb.isNotNull(root.get("commentsAnalyst")));
                predicates.add(cb.notEqual(root.get("commentsAnalyst"), ""));

                if (cveId != null && !cveId.isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("cveId")), 
                        "%" + cveId.toLowerCase() + "%"));
                }

                if (packageName != null && !packageName.isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("packageName")), 
                        "%" + packageName.toLowerCase() + "%"));
                }

                if (severity != null && !severity.equals("all")) {
                    predicates.add(cb.equal(root.get("baseSeverity"), severity));
                }

                if (year != null && !year.equals("all")) {
                    Expression<Integer> yearExpr = cb.function("EXTRACT", Integer.class, cb.literal("YEAR"), root.get("publishedDate"));
                    predicates.add(cb.equal(yearExpr, Integer.parseInt(year)));
                }
                
                // Filter by assetId if provided - find all related packages
                if (assetId != null) {
                    // Get the main asset
                    Optional<Asset> mainAsset = assetRepository.findById(assetId);
                    if (mainAsset.isPresent()) {
                        String assetName = mainAsset.get().getName();
                        
                        // Find all scan packages related to this asset
                        List<Long> relatedAssetIds = assetRepository.findAll().stream()
                            .filter(a -> assetName.equals(a.getRelatedAssetName()) || a.getId().equals(assetId))
                            .map(Asset::getId)
                            .collect(Collectors.toList());
                        
                        if (!relatedAssetIds.isEmpty()) {
                            predicates.add(root.get("assetId").in(relatedAssetIds));
                        } else {
                            // Fallback to exact match
                            predicates.add(cb.equal(root.get("assetId"), assetId));
                        }
                    } else {
                        // Asset not found, use exact match
                        predicates.add(cb.equal(root.get("assetId"), assetId));
                    }
                }

                return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
            }, 
            pageRequest
        );

        // Convert VulnerabilityResult to CveJustificationHistory for frontend compatibility
        List<CveJustificationHistory> historyList = vulnResults.getContent().stream()
            .map(vuln -> {
                CveJustificationHistory history = new CveJustificationHistory();
                history.setId(vuln.getId());
                history.setCveId(vuln.getCveId());
                history.setPackageName(vuln.getPackageName());
                history.setPackageVersion(vuln.getPackageVersion());
                history.setCveDescription(vuln.getCveDescription());
                history.setBaseScore(vuln.getBaseScore());
                history.setBaseSeverity(vuln.getBaseSeverity());
                history.setVersionCvss(vuln.getCvssVersion());
                history.setCwe(vuln.getCwe());
                history.setVectorString(vuln.getVectorString());
                history.setPublishedDate(vuln.getPublishedDate());
                history.setLastModifiedDate(vuln.getLastModifiedDate());
                history.setAssetId(vuln.getAssetId());
                
                // Get asset name
                if (vuln.getAssetId() != null) {
                    assetRepository.findById(vuln.getAssetId()).ifPresent(asset -> {
                        // For scan packages, use related_asset_name; for manual assets, use name
                        String name = asset.getRelatedAssetName() != null ? asset.getRelatedAssetName() : asset.getName();
                        history.setAssetName(name);
                    });
                }
                
                // Parse comments_analyst - convert String to List<Map<String, Object>>
                if (vuln.getCommentsAnalyst() != null && !vuln.getCommentsAnalyst().isEmpty()) {
                    try {
                        // Try to parse as JSON array
                        List<Map<String, Object>> commentsList = objectMapper.readValue(
                            vuln.getCommentsAnalyst(), 
                            new TypeReference<List<Map<String, Object>>>() {}
                        );
                        history.setCommentsAnalyst(commentsList);
                    } catch (Exception e) {
                        // If not JSON, create a simple comment object
                        Map<String, Object> comment = new HashMap<>();
                        comment.put("text", vuln.getCommentsAnalyst());
                        comment.put("author", "Unknown");
                        comment.put("timestamp", LocalDateTime.now().toString());
                        history.setCommentsAnalyst(List.of(comment));
                    }
                }
                
                // Use publishedDate as justifiedDate for now (or you could add a separate field)
                history.setJustifiedDate(vuln.getPublishedDate());
                
                return history;
            })
            .toList();

        PageResponse<CveJustificationHistory> response = new PageResponse<>();
        response.setData(historyList);
        
        PageResponse.Pagination pagination = new PageResponse.Pagination();
        pagination.setPage(page);
        pagination.setLimit(limit);
        pagination.setTotal(vulnResults.getTotalElements());
        pagination.setTotalPages(vulnResults.getTotalPages());
        response.setPagination(pagination);

        return response;
    }

    public Map<String, Object> getHistoryStats() {
        String query = """
            SELECT
                COUNT(v),
                COUNT(CASE WHEN v.baseSeverity = 'CRITICAL' THEN 1 END),
                COUNT(CASE WHEN v.baseSeverity = 'HIGH' THEN 1 END),
                COUNT(CASE WHEN v.baseSeverity = 'MEDIUM' THEN 1 END),
                COUNT(CASE WHEN v.baseSeverity = 'LOW' THEN 1 END),
                COUNT(DISTINCT v.packageName),
                MIN(v.publishedDate),
                MAX(v.publishedDate)
            FROM VulnerabilityResult v
            WHERE v.commentsAnalyst IS NOT NULL AND v.commentsAnalyst != ''
        """;

        Object[] result = (Object[]) entityManager.createQuery(query).getSingleResult();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", result[0]);
        stats.put("critical", result[1]);
        stats.put("high", result[2]);
        stats.put("medium", result[3]);
        stats.put("low", result[4]);
        stats.put("unique_packages", result[5]);
        stats.put("first_justification", result[6]);
        stats.put("last_justification", result[7]);

        return stats;
    }

    public List<Integer> getAvailableYears() {
        String query = "SELECT DISTINCT EXTRACT(YEAR FROM v.publishedDate) FROM VulnerabilityResult v WHERE v.commentsAnalyst IS NOT NULL AND v.commentsAnalyst != '' AND v.publishedDate IS NOT NULL ORDER BY 1 DESC";
        return entityManager.createQuery(query, Integer.class).getResultList();
    }
}