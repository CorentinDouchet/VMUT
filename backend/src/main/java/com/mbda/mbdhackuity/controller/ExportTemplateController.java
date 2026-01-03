package com.mbda.mbdhackuity.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller pour la gestion des templates DOCX d'export
 */
@RestController
@RequestMapping("/api/export/templates")
@Slf4j
public class ExportTemplateController {

    @Value("${app.uploads.templates.dir:uploads/templates}")
    private String templatesDir;

    /**
     * Liste tous les templates disponibles
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listTemplates() {
        log.info("📋 Liste des templates demandée");
        
        File dir = new File(templatesDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        
        List<Map<String, Object>> templates = new ArrayList<>();
        File[] files = dir.listFiles((d, name) -> name.toLowerCase().endsWith(".docx"));
        
        if (files != null) {
            for (File file : files) {
                Map<String, Object> templateInfo = new HashMap<>();
                templateInfo.put("name", file.getName());
                templateInfo.put("size", file.length());
                templateInfo.put("lastModified", file.lastModified());
                templates.add(templateInfo);
            }
        }
        
        log.info("✅ {} template(s) trouvé(s)", templates.size());
        return ResponseEntity.ok(templates);
    }

    /**
     * Upload d'un nouveau template
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<Map<String, String>> uploadTemplate(@RequestParam("file") MultipartFile file) {
        log.info("📤 Upload de template: {}", file.getOriginalFilename());
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Le fichier est vide"));
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".docx")) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Seuls les fichiers .docx sont acceptés"));
        }
        
        try {
            // Créer le répertoire si nécessaire
            File dir = new File(templatesDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            // Sauvegarder le fichier
            Path targetPath = Paths.get(templatesDir, filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("✅ Template sauvegardé: {}", filename);
            return ResponseEntity.ok(Map.of(
                "message", "Template uploadé avec succès",
                "filename", filename
            ));
            
        } catch (IOException e) {
            log.error("❌ Erreur lors de l'upload du template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur lors de l'upload: " + e.getMessage()));
        }
    }

    /**
     * Suppression d'un template
     */
    @DeleteMapping("/{filename}")
    @PreAuthorize("hasAnyRole('AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable String filename) {
        log.info("🗑️ Suppression du template: {}", filename);
        
        if (!filename.toLowerCase().endsWith(".docx")) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Nom de fichier invalide"));
        }
        
        File file = new File(templatesDir, filename);
        
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        
        if (file.delete()) {
            log.info("✅ Template supprimé: {}", filename);
            return ResponseEntity.ok(Map.of("message", "Template supprimé avec succès"));
        } else {
            log.error("❌ Impossible de supprimer le template: {}", filename);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Impossible de supprimer le fichier"));
        }
    }

    /**
     * Téléchargement d'un template
     */
    @GetMapping("/{filename}")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable String filename) {
        log.info("📥 Téléchargement du template: {}", filename);
        
        if (!filename.toLowerCase().endsWith(".docx")) {
            return ResponseEntity.badRequest().build();
        }
        
        File file = new File(templatesDir, filename);
        
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            byte[] content = Files.readAllBytes(file.toPath());
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                .body(content);
        } catch (IOException e) {
            log.error("❌ Erreur lors du téléchargement du template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
