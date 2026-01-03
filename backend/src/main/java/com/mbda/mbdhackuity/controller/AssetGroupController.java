package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.AssetGroupDTO;
import com.mbda.mbdhackuity.dto.AssetGroupResponseDTO;
import com.mbda.mbdhackuity.service.AssetGroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des groupes d'assets
 * STB_REQ_0101
 */
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Slf4j
public class AssetGroupController {
    
    private final AssetGroupService assetGroupService;
    
    /**
     * Créer un nouveau groupe (ADMINISTRATEUR uniquement)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<AssetGroupResponseDTO> createGroup(
            @RequestBody AssetGroupDTO dto,
            Authentication authentication) {
        
        log.info("Requête de création de groupe: {}", dto.getName());
        String username = authentication.getName();
        
        try {
            AssetGroupResponseDTO response = assetGroupService.createGroup(dto, username);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la création du groupe: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Mettre à jour un groupe existant (ADMINISTRATEUR uniquement)
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<AssetGroupResponseDTO> updateGroup(
            @PathVariable Long id,
            @RequestBody AssetGroupDTO dto,
            Authentication authentication) {
        
        log.info("Requête de mise à jour du groupe {}", id);
        String username = authentication.getName();
        
        try {
            AssetGroupResponseDTO response = assetGroupService.updateGroup(id, dto, username);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la mise à jour du groupe: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Récupérer tous les groupes (accessible à tous les utilisateurs authentifiés)
     * Les ADMINISTRATEUR voient tous les groupes
     * Les autres utilisateurs voient leurs groupes + groupe "Non classé"
     */
    @GetMapping
    public ResponseEntity<List<AssetGroupResponseDTO>> getAllGroups(Authentication authentication) {
        log.info("Récupération de tous les groupes");
        List<AssetGroupResponseDTO> groups = assetGroupService.getAllGroups();
        return ResponseEntity.ok(groups);
    }
    
    /**
     * Récupérer les groupes accessibles par l'utilisateur connecté
     */
    @GetMapping("/my-groups")
    public ResponseEntity<List<AssetGroupResponseDTO>> getMyGroups(Authentication authentication) {
        String username = authentication.getName();
        log.info("Récupération des groupes pour l'utilisateur: {}", username);
        
        // TODO: Récupérer l'ID utilisateur depuis le username
        // Pour l'instant, retourner tous les groupes (à implémenter)
        List<AssetGroupResponseDTO> groups = assetGroupService.getAllGroups();
        return ResponseEntity.ok(groups);
    }
    
    /**
     * Récupérer un groupe par ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<AssetGroupResponseDTO> getGroupById(@PathVariable Long id) {
        log.info("Récupération du groupe {}", id);
        
        try {
            AssetGroupResponseDTO group = assetGroupService.getGroupById(id);
            return ResponseEntity.ok(group);
        } catch (IllegalArgumentException e) {
            log.error("Groupe non trouvé: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Supprimer un groupe (ADMINISTRATEUR uniquement)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long id,
            Authentication authentication) {
        
        log.info("Requête de suppression du groupe {}", id);
        String username = authentication.getName();
        
        try {
            assetGroupService.deleteGroup(id, username);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Erreur lors de la suppression du groupe: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Ajouter un utilisateur à un groupe
     */
    @PostMapping("/{groupId}/users/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> addUserToGroup(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            Authentication authentication) {
        
        log.info("Ajout de l'utilisateur {} au groupe {}", userId, groupId);
        String username = authentication.getName();
        
        try {
            assetGroupService.addUserToGroup(groupId, userId, username);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Retirer un utilisateur d'un groupe
     */
    @DeleteMapping("/{groupId}/users/{userId}")
    @PreAuthorize("hasRole('ADMINISTRATEUR')")
    public ResponseEntity<Void> removeUserFromGroup(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            Authentication authentication) {
        
        log.info("Retrait de l'utilisateur {} du groupe {}", userId, groupId);
        String username = authentication.getName();
        
        try {
            assetGroupService.removeUserFromGroup(groupId, userId, username);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Ajouter un asset à un groupe
     */
    @PostMapping("/{groupId}/assets/{assetId}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'AUTEUR')")
    public ResponseEntity<Void> addAssetToGroup(
            @PathVariable Long groupId,
            @PathVariable Long assetId,
            Authentication authentication) {
        
        log.info("Ajout de l'asset {} au groupe {}", assetId, groupId);
        String username = authentication.getName();
        
        try {
            assetGroupService.addAssetToGroup(groupId, assetId, username);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Retirer un asset d'un groupe
     */
    @DeleteMapping("/{groupId}/assets/{assetId}")
    @PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'AUTEUR')")
    public ResponseEntity<Void> removeAssetFromGroup(
            @PathVariable Long groupId,
            @PathVariable Long assetId,
            Authentication authentication) {
        
        log.info("Retrait de l'asset {} du groupe {}", assetId, groupId);
        String username = authentication.getName();
        
        try {
            assetGroupService.removeAssetFromGroup(groupId, assetId, username);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Erreur: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
