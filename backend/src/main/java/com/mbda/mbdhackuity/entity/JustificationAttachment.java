package com.mbda.mbdhackuity.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Pièce jointe associée à une justification de vulnérabilité (STB_REQ_0300)
 * Permet de stocker des documents PDF, TXT, images comme preuves
 */
@Entity
@Table(name = "justification_attachments")
@Data
public class JustificationAttachment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Nom du fichier original
     */
    @Column(nullable = false)
    private String filename;
    
    /**
     * Type MIME du fichier (application/pdf, text/plain, image/png, etc.)
     */
    @Column(name = "file_type", nullable = false)
    private String fileType;
    
    /**
     * Chemin de stockage du fichier sur le serveur
     */
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    /**
     * Taille du fichier en bytes
     */
    @Column(name = "file_size")
    private Long fileSize;
    
    /**
     * Date d'upload
     */
    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;
    
    /**
     * Utilisateur ayant uploadé le fichier
     */
    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;
    
    /**
     * Description ou commentaire sur la pièce jointe
     */
    @Column(columnDefinition = "TEXT")
    private String description;
    
    /**
     * Vulnérabilité à laquelle est rattachée cette pièce jointe
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vulnerability_id", nullable = false)
    @JsonIgnore
    private VulnerabilityResult vulnerability;
    
    /**
     * Constructeur par défaut
     */
    public JustificationAttachment() {
        this.uploadDate = LocalDateTime.now();
    }
    
    /**
     * Constructeur avec paramètres
     */
    public JustificationAttachment(String filename, String fileType, String filePath, 
                                   Long fileSize, String uploadedBy, VulnerabilityResult vulnerability) {
        this();
        this.filename = filename;
        this.fileType = fileType;
        this.filePath = filePath;
        this.fileSize = fileSize;
        this.uploadedBy = uploadedBy;
        this.vulnerability = vulnerability;
    }
}
