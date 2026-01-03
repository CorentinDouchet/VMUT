package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.JustificationAttachment;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import com.mbda.mbdhackuity.repository.JustificationAttachmentRepository;
import com.mbda.mbdhackuity.repository.VulnerabilityResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Service de gestion du stockage des pièces jointes (STB_REQ_0300)
 */
@Service
public class FileStorageService {
    
    private final Path fileStorageLocation;
    private final JustificationAttachmentRepository attachmentRepository;
    private final VulnerabilityResultRepository vulnerabilityRepository;
    
    // Types de fichiers autorisés
    private static final List<String> ALLOWED_FILE_TYPES = Arrays.asList(
        "application/pdf",
        "text/plain",
        "image/png",
        "image/jpeg",
        "image/jpg",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword" // .doc
    );
    
    // Taille maximale: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    
    @Autowired
    public FileStorageService(
            @Value("${file.upload-dir:uploads/attachments}") String uploadDir,
            JustificationAttachmentRepository attachmentRepository,
            VulnerabilityResultRepository vulnerabilityRepository) {
        this.attachmentRepository = attachmentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Impossible de créer le répertoire de stockage des fichiers.", ex);
        }
    }
    
    /**
     * Upload un fichier et crée l'enregistrement en base
     */
    public JustificationAttachment storeFile(MultipartFile file, Long vulnerabilityId, 
                                             String uploadedBy, String description) {
        // Validation
        validateFile(file);
        
        // Vérifier que la vulnérabilité existe
        VulnerabilityResult vulnerability = vulnerabilityRepository.findById(vulnerabilityId)
            .orElseThrow(() -> new RuntimeException("Vulnérabilité non trouvée: " + vulnerabilityId));
        
        // Nettoyer le nom de fichier
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        
        // Générer un nom unique
        String fileExtension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            fileExtension = originalFilename.substring(dotIndex);
        }
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        try {
            // Vérifier qu'il n'y a pas de caractères invalides
            if (originalFilename.contains("..")) {
                throw new RuntimeException("Nom de fichier invalide: " + originalFilename);
            }
            
            // Copier le fichier
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Créer l'enregistrement en base
            JustificationAttachment attachment = new JustificationAttachment();
            attachment.setFilename(originalFilename);
            attachment.setFileType(file.getContentType());
            attachment.setFilePath(uniqueFilename);
            attachment.setFileSize(file.getSize());
            attachment.setUploadDate(LocalDateTime.now());
            attachment.setUploadedBy(uploadedBy);
            attachment.setDescription(description);
            attachment.setVulnerability(vulnerability);
            
            return attachmentRepository.save(attachment);
            
        } catch (IOException ex) {
            throw new RuntimeException("Impossible de stocker le fichier " + originalFilename, ex);
        }
    }
    
    /**
     * Récupère un fichier par son ID
     */
    public Resource loadFileAsResource(Long attachmentId) {
        try {
            JustificationAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Pièce jointe non trouvée: " + attachmentId));
            
            Path filePath = this.fileStorageLocation.resolve(attachment.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("Fichier non trouvé: " + attachment.getFilename());
            }
        } catch (Exception ex) {
            throw new RuntimeException("Erreur lors de la récupération du fichier", ex);
        }
    }
    
    /**
     * Récupère les métadonnées d'une pièce jointe
     */
    public JustificationAttachment getAttachment(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Pièce jointe non trouvée: " + attachmentId));
    }
    
    /**
     * Liste les pièces jointes d'une vulnérabilité
     */
    public List<JustificationAttachment> getAttachmentsByVulnerability(Long vulnerabilityId) {
        return attachmentRepository.findByVulnerabilityId(vulnerabilityId);
    }
    
    /**
     * Supprime une pièce jointe
     */
    public void deleteAttachment(Long attachmentId) {
        JustificationAttachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new RuntimeException("Pièce jointe non trouvée: " + attachmentId));
        
        try {
            // Supprimer le fichier physique
            Path filePath = this.fileStorageLocation.resolve(attachment.getFilePath()).normalize();
            Files.deleteIfExists(filePath);
            
            // Supprimer l'enregistrement en base
            attachmentRepository.delete(attachment);
            
        } catch (IOException ex) {
            throw new RuntimeException("Erreur lors de la suppression du fichier", ex);
        }
    }
    
    /**
     * Valide qu'un fichier est acceptable
     */
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Fichier vide");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("Fichier trop volumineux (max 10MB)");
        }
        
        if (!ALLOWED_FILE_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Type de fichier non autorisé: " + file.getContentType() + 
                ". Formats acceptés: PDF, TXT, PNG, JPG, DOCX, DOC");
        }
    }
}
