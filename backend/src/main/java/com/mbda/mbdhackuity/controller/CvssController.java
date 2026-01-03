package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.CommentRequest;
import com.mbda.mbdhackuity.dto.CvssScoreUpdateRequest;
import com.mbda.mbdhackuity.dto.BulkCommentRequest;
import com.mbda.mbdhackuity.entity.JustificationAttachment;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.service.CvssService;
import com.mbda.mbdhackuity.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cvss")
@Tag(name = "CVSS", description = "Calcul et modification des scores CVSS")
public class CvssController {

    @Autowired
    private CvssService cvssService;

    @Autowired
    private FileStorageService fileStorageService;

    @Operation(summary = "Mettre à jour le score CVSS d'une vulnérabilité", 
               description = "Enregistre le score CVSS calculé (v3.0, v3.1 ou v4.0) pour une vulnérabilité")
    @PutMapping("/vulnerability/{id}/score")
    public ResponseEntity<Map<String, Object>> updateScore(
            @PathVariable Long id,
            @RequestBody CvssScoreUpdateRequest request) {
        
        VulnerabilityResult updated = cvssService.updateScore(
            id, 
            request.getScore(), 
            request.getVector(), 
            request.getSeverity(), 
            request.getModifiedBy()
        );
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "vulnerability", updated
        ));
    }

    // DELETE /api/cvss/vulnerability/{id}/score
    @DeleteMapping("/vulnerability/{id}/score")
    public ResponseEntity<VulnerabilityResult> resetScore(@PathVariable Long id) {
        return ResponseEntity.ok(cvssService.resetScore(id));
    }

    // POST /api/cvss/vulnerability/{id}/comment
    @PostMapping("/vulnerability/{id}/comment")
    public ResponseEntity<VulnerabilityResult> addComment(
            @PathVariable Long id,
            @RequestBody CommentRequest request) {
        
        return ResponseEntity.ok(cvssService.addComment(
            id, 
            request.getComment(), 
            request.getAuthor(), 
            request.getRole()
        ));
    }

    // DELETE /api/cvss/vulnerability/{vulnId}/comment/{commentId}
    @DeleteMapping("/vulnerability/{vulnId}/comment/{commentId}")
    public ResponseEntity<VulnerabilityResult> deleteComment(
            @PathVariable Long vulnId,
            @PathVariable Long commentId,
            @RequestParam String role) {
        
        return ResponseEntity.ok(cvssService.deleteComment(vulnId, commentId, role));
    }

    // GET /api/cvss/vulnerability/{id}
    @GetMapping("/vulnerability/{id}")
    public ResponseEntity<VulnerabilityResult> getVulnerabilityDetails(@PathVariable Long id) {
        return ResponseEntity.ok(cvssService.getVulnerabilityWithEffectiveScores(id));
    }

    // POST /api/cvss/vulnerabilities/bulk-comment
    @PostMapping("/vulnerabilities/bulk-comment")
    public ResponseEntity<Map<String, Object>> addBulkComment(
            @RequestBody BulkCommentRequest request) {
        
        Map<String, Object> result = cvssService.addBulkComment(
            request.getIds(),
            request.getComment(),
            request.getAuthor(),
            request.getRole()
        );
        
        return ResponseEntity.ok(result);
    }
    
    // === Endpoints pour les pièces jointes (STB_REQ_0300) ===
    
    @Operation(summary = "Upload une pièce jointe pour une vulnérabilité",
               description = "Permet d'ajouter un fichier PDF, TXT, image comme preuve de justification")
    @PostMapping("/vulnerability/{id}/attachments")
    public ResponseEntity<Map<String, Object>> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("uploadedBy") String uploadedBy,
            @RequestParam(value = "description", required = false) String description) {
        
        try {
            JustificationAttachment attachment = fileStorageService.storeFile(
                file, id, uploadedBy, description
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Fichier uploadé avec succès",
                "attachment", attachment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @Operation(summary = "Liste les pièces jointes d'une vulnérabilité")
    @GetMapping("/vulnerability/{id}/attachments")
    public ResponseEntity<List<JustificationAttachment>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(fileStorageService.getAttachmentsByVulnerability(id));
    }
    
    @Operation(summary = "Télécharge une pièce jointe")
    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long attachmentId) {
        try {
            JustificationAttachment attachment = fileStorageService.getAttachment(attachmentId);
            Resource resource = fileStorageService.loadFileAsResource(attachmentId);
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"" + attachment.getFilename() + "\"")
                .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @Operation(summary = "Supprime une pièce jointe")
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Map<String, Object>> deleteAttachment(@PathVariable Long attachmentId) {
        try {
            fileStorageService.deleteAttachment(attachmentId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Pièce jointe supprimée"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}