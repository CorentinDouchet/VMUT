package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.JustificationCopyRequest;
import com.mbda.mbdhackuity.dto.JustificationDTO;
import com.mbda.mbdhackuity.dto.JustificationSuggestion;
import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.JustificationAttachment;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.JustificationAttachmentRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service pour la réutilisation des justifications entre actifs
 * Implémentation de STB_REQ_0150
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JustificationService {

    private final VulnerabilityResultRepository vulnerabilityResultRepository;
    private final AssetRepository assetRepository;
    private final JustificationAttachmentRepository attachmentRepository;
    private final AuthenticationService authenticationService;
    private final AuditLogService auditLogService;

    /**
     * Récupère toutes les justifications d'un actif
     */
    public List<JustificationDTO> getJustificationsByAsset(Long assetId) {
        log.info("📋 Récupération des justifications pour l'actif {}", assetId);
        
        Optional<Asset> assetOpt = assetRepository.findById(assetId);
        if (assetOpt.isEmpty()) {
            log.warn("⚠️ Actif {} introuvable", assetId);
            return Collections.emptyList();
        }
        
        Asset asset = assetOpt.get();
        List<VulnerabilityResult> vulnerabilities = vulnerabilityResultRepository.findByAssetId(assetId);
        
        return vulnerabilities.stream()
            .filter(v -> v.getCommentsAnalyst() != null && !v.getCommentsAnalyst().trim().isEmpty())
            .map(v -> mapToJustificationDTO(v, asset))
            .collect(Collectors.toList());
    }

    /**
     * Recherche des justifications par CVE
     */
    public List<JustificationDTO> findJustificationsByCve(String cveId) {
        log.info("🔍 Recherche des justifications pour CVE {}", cveId);
        
        List<VulnerabilityResult> vulnerabilities = vulnerabilityResultRepository.findByCveId(cveId);
        
        return vulnerabilities.stream()
            .filter(v -> v.getCommentsAnalyst() != null && !v.getCommentsAnalyst().trim().isEmpty())
            .map(v -> {
                Optional<Asset> assetOpt = assetRepository.findById(v.getAssetId());
                return mapToJustificationDTO(v, assetOpt.orElse(null));
            })
            .collect(Collectors.toList());
    }

    /**
     * Copie des justifications d'un actif source vers un actif cible
     */
    @Transactional
    public Map<String, Object> copyJustifications(JustificationCopyRequest request) {
        log.info("📝 Copie de justifications: {} CVE de l'actif {} vers l'actif {}", 
                request.getCveIds().size(), request.getSourceAssetId(), request.getTargetAssetId());
        
        // Vérifier que les actifs existent
        Asset sourceAsset = assetRepository.findById(request.getSourceAssetId())
            .orElseThrow(() -> new IllegalArgumentException("Actif source introuvable"));
        
        Asset targetAsset = assetRepository.findById(request.getTargetAssetId())
            .orElseThrow(() -> new IllegalArgumentException("Actif cible introuvable"));
        
        int copiedCount = 0;
        int skippedCount = 0;
        int errorCount = 0;
        List<String> copiedCves = new ArrayList<>();
        List<String> skippedCves = new ArrayList<>();
        
        String currentUser = authenticationService.getCurrentUsername();
        
        for (String cveId : request.getCveIds()) {
            try {
                // Récupérer la vulnérabilité source
                List<VulnerabilityResult> sourceVulns = vulnerabilityResultRepository.findByCveId(cveId)
                    .stream()
                    .filter(v -> v.getAssetId().equals(request.getSourceAssetId()))
                    .toList();
                
                if (sourceVulns.isEmpty()) {
                    log.warn("⚠️ CVE {} introuvable sur l'actif source", cveId);
                    skippedCount++;
                    skippedCves.add(cveId);
                    continue;
                }
                
                VulnerabilityResult sourceVuln = sourceVulns.get(0);
                
                // Vérifier si la CVE existe sur l'actif cible
                List<VulnerabilityResult> targetVulns = vulnerabilityResultRepository.findByCveId(cveId)
                    .stream()
                    .filter(v -> v.getAssetId().equals(request.getTargetAssetId()))
                    .toList();
                
                if (targetVulns.isEmpty()) {
                    log.warn("⚠️ CVE {} n'existe pas sur l'actif cible", cveId);
                    skippedCount++;
                    skippedCves.add(cveId);
                    continue;
                }
                
                for (VulnerabilityResult targetVuln : targetVulns) {
                    // Vérifier si déjà justifiée
                    if (targetVuln.getCommentsAnalyst() != null && !targetVuln.getCommentsAnalyst().trim().isEmpty()
                        && !request.isOverwriteExisting()) {
                        log.debug("⏭️ CVE {} déjà justifiée sur l'actif cible, ignorée", cveId);
                        skippedCount++;
                        skippedCves.add(cveId);
                        continue;
                    }
                    
                    // Copier la justification
                    String oldComment = targetVuln.getCommentsAnalyst();
                    targetVuln.setCommentsAnalyst(sourceVuln.getCommentsAnalyst());
                    targetVuln.setCommentsValidator(sourceVuln.getCommentsValidator());
                    targetVuln.setValidityStatus(sourceVuln.getValidityStatus());
                    targetVuln.setLastModifiedDate(LocalDateTime.now());
                    
                    vulnerabilityResultRepository.save(targetVuln);
                    
                    // Logger dans l'audit
                    String justificationText = String.format("Copié depuis %s - %s", 
                        sourceAsset.getName(), targetVuln.getCommentsAnalyst());
                    auditLogService.logJustification(
                        currentUser,
                        cveId,
                        targetAsset.getName(),
                        justificationText
                    );
                    
                    // Copier les pièces jointes si demandé
                    if (request.isCopyAttachments()) {
                        copyAttachments(sourceVuln.getId(), targetVuln.getId());
                    }
                    
                    copiedCount++;
                    copiedCves.add(cveId);
                    
                    log.info("✅ Justification copiée pour CVE {} vers vulnérabilité {}", cveId, targetVuln.getId());
                }
                
            } catch (Exception e) {
                log.error("❌ Erreur lors de la copie de CVE {}: {}", cveId, e.getMessage(), e);
                errorCount++;
            }
        }
        
        log.info("✅ Copie terminée: {} copiées, {} ignorées, {} erreurs", 
                copiedCount, skippedCount, errorCount);
        
        Map<String, Object> result = new HashMap<>();
        result.put("copiedCount", copiedCount);
        result.put("skippedCount", skippedCount);
        result.put("errorCount", errorCount);
        result.put("copiedCves", copiedCves);
        result.put("skippedCves", skippedCves);
        result.put("sourceAssetName", sourceAsset.getName());
        result.put("targetAssetName", targetAsset.getName());
        
        return result;
    }

    /**
     * Suggère des justifications réutilisables pour un actif
     */
    public List<JustificationSuggestion> suggestReusableJustifications(Long assetId) {
        log.info("💡 Suggestion de justifications réutilisables pour l'actif {}", assetId);
        
        // Récupérer les CVE de l'actif qui n'ont pas encore de justification
        List<VulnerabilityResult> unjustifiedVulns = vulnerabilityResultRepository.findByAssetId(assetId)
            .stream()
            .filter(v -> v.getCommentsAnalyst() == null || v.getCommentsAnalyst().trim().isEmpty())
            .toList();
        
        Map<String, JustificationSuggestion> suggestions = new HashMap<>();
        
        for (VulnerabilityResult vuln : unjustifiedVulns) {
            String cveId = vuln.getCveId();
            
            // Chercher des justifications existantes pour cette CVE sur d'autres actifs
            List<VulnerabilityResult> justifiedVulns = vulnerabilityResultRepository.findByCveId(cveId)
                .stream()
                .filter(v -> !v.getAssetId().equals(assetId))
                .filter(v -> v.getCommentsAnalyst() != null && !v.getCommentsAnalyst().trim().isEmpty())
                .toList();
            
            if (!justifiedVulns.isEmpty()) {
                // Trouver la justification la plus récente
                VulnerabilityResult mostRecent = justifiedVulns.stream()
                    .max(Comparator.comparing(VulnerabilityResult::getLastModifiedDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(justifiedVulns.get(0));
                
                Optional<Asset> assetOpt = assetRepository.findById(mostRecent.getAssetId());
                String assetName = assetOpt.map(Asset::getName).orElse("Inconnu");
                
                String preview = mostRecent.getCommentsAnalyst();
                if (preview.length() > 100) {
                    preview = preview.substring(0, 100) + "...";
                }
                
                suggestions.put(cveId, new JustificationSuggestion(
                    cveId,
                    justifiedVulns.size(),
                    assetName,
                    preview
                ));
            }
        }
        
        return new ArrayList<>(suggestions.values());
    }

    /**
     * Copie les pièces jointes d'une vulnérabilité à une autre
     */
    private void copyAttachments(Long sourceVulnId, Long targetVulnId) {
        List<JustificationAttachment> sourceAttachments = 
            attachmentRepository.findByVulnerabilityId(sourceVulnId);
        
        // Récupérer la vulnérabilité cible pour l'association
        VulnerabilityResult targetVuln = vulnerabilityResultRepository.findById(targetVulnId)
            .orElseThrow(() -> new RuntimeException("Vulnérabilité cible introuvable: " + targetVulnId));
        
        for (JustificationAttachment sourceAttachment : sourceAttachments) {
            try {
                // Copier le fichier physique
                Path sourcePath = Paths.get(sourceAttachment.getFilePath());
                if (!Files.exists(sourcePath)) {
                    log.warn("⚠️ Fichier source introuvable: {}", sourcePath);
                    continue;
                }
                
                // Générer un nouveau nom de fichier pour éviter les conflits
                String newFilename = "copy_" + System.currentTimeMillis() + "_" + sourceAttachment.getFilename();
                Path targetPath = sourcePath.getParent().resolve(newFilename);
                
                Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
                
                // Créer l'entrée de pièce jointe
                JustificationAttachment newAttachment = new JustificationAttachment();
                newAttachment.setVulnerability(targetVuln);
                newAttachment.setFilename(newFilename);
                newAttachment.setFileType(sourceAttachment.getFileType());
                newAttachment.setFilePath(targetPath.toString());
                newAttachment.setFileSize(sourceAttachment.getFileSize());
                newAttachment.setUploadedBy(authenticationService.getCurrentUsername());
                newAttachment.setUploadDate(LocalDateTime.now());
                
                attachmentRepository.save(newAttachment);
                
                log.debug("📎 Pièce jointe copiée: {} -> {}", sourceAttachment.getFilename(), newFilename);
                
            } catch (IOException e) {
                log.error("❌ Erreur lors de la copie de la pièce jointe {}: {}", 
                        sourceAttachment.getFilename(), e.getMessage(), e);
            }
        }
    }

    /**
     * Mapper VulnerabilityResult vers JustificationDTO
     */
    private JustificationDTO mapToJustificationDTO(VulnerabilityResult vuln, Asset asset) {
        JustificationDTO dto = new JustificationDTO();
        dto.setVulnerabilityId(vuln.getId());
        dto.setCveId(vuln.getCveId());
        dto.setPackageName(vuln.getPackageName());
        dto.setPackageVersion(vuln.getPackageVersion());
        dto.setCommentsAnalyst(vuln.getCommentsAnalyst());
        dto.setCommentsValidator(vuln.getCommentsValidator());
        dto.setValidityStatus(vuln.getValidityStatus());
        dto.setBaseScore(vuln.getBaseScore());
        dto.setBaseSeverity(vuln.getBaseSeverity());
        dto.setLastModifiedDate(vuln.getLastModifiedDate());
        dto.setAssetId(vuln.getAssetId());
        
        if (asset != null) {
            dto.setAssetName(asset.getName());
        }
        
        // Récupérer les pièces jointes
        List<JustificationAttachment> attachments = 
            attachmentRepository.findByVulnerabilityId(vuln.getId());
        dto.setAttachments(attachments);
        
        return dto;
    }
}
