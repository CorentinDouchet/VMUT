package com.mbda.mbdhackuity.repository;

import com.mbda.mbdhackuity.entity.JustificationAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour la gestion des pièces jointes de justification
 */
@Repository
public interface JustificationAttachmentRepository extends JpaRepository<JustificationAttachment, Long> {
    
    /**
     * Récupère toutes les pièces jointes d'une vulnérabilité
     * @param vulnerabilityId ID de la vulnérabilité
     * @return Liste des pièces jointes
     */
    List<JustificationAttachment> findByVulnerabilityId(Long vulnerabilityId);
    
    /**
     * Compte le nombre de pièces jointes pour une vulnérabilité
     * @param vulnerabilityId ID de la vulnérabilité
     * @return Nombre de pièces jointes
     */
    long countByVulnerabilityId(Long vulnerabilityId);
    
    /**
     * Récupère les pièces jointes uploadées par un utilisateur
     * @param uploadedBy Nom d'utilisateur
     * @return Liste des pièces jointes
     */
    List<JustificationAttachment> findByUploadedBy(String uploadedBy);
}
