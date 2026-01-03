package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.AssetGroupDTO;
import com.mbda.mbdhackuity.dto.AssetGroupResponseDTO;
import com.mbda.mbdhackuity.entity.Asset;
import com.mbda.mbdhackuity.entity.AssetGroup;
import com.mbda.mbdhackuity.entity.User;
import com.mbda.mbdhackuity.repository.AssetGroupRepository;
import com.mbda.mbdhackuity.repository.AssetRepository;
import com.mbda.mbdhackuity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service de gestion des groupes d'assets
 * STB_REQ_0101
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AssetGroupService {
    
    private final AssetGroupRepository assetGroupRepository;
    private final UserRepository userRepository;
    private final AssetRepository assetRepository;
    private final AuditLogService auditLogService;
    
    /**
     * Créer un nouveau groupe d'assets
     */
    @Transactional
    public AssetGroupResponseDTO createGroup(AssetGroupDTO dto, String createdBy) {
        log.info("Création du groupe: {} par {}", dto.getName(), createdBy);
        
        // Vérifier si le nom existe déjà
        if (assetGroupRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Un groupe avec ce nom existe déjà: " + dto.getName());
        }
        
        AssetGroup group = new AssetGroup();
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        group.setPlmContainer(dto.getPlmContainer());
        group.setCreatedBy(createdBy);
        group.setCreatedAt(LocalDateTime.now());
        
        AssetGroup saved = assetGroupRepository.save(group);
        
        // Journaliser
        auditLogService.logGroupCreation(saved.getId(), createdBy);
        
        return toResponseDTO(saved);
    }
    
    /**
     * Mettre à jour un groupe existant
     */
    @Transactional
    public AssetGroupResponseDTO updateGroup(Long id, AssetGroupDTO dto, String updatedBy) {
        log.info("Mise à jour du groupe {} par {}", id, updatedBy);
        
        AssetGroup group = assetGroupRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé: " + id));
        
        // Vérifier si le nouveau nom n'est pas déjà utilisé
        if (!group.getName().equals(dto.getName()) && assetGroupRepository.existsByName(dto.getName())) {
            throw new IllegalArgumentException("Un groupe avec ce nom existe déjà: " + dto.getName());
        }
        
        group.setName(dto.getName());
        group.setDescription(dto.getDescription());
        group.setPlmContainer(dto.getPlmContainer());
        group.setUpdatedBy(updatedBy);
        group.setUpdatedAt(LocalDateTime.now());
        
        AssetGroup saved = assetGroupRepository.save(group);
        
        // Journaliser
        auditLogService.logGroupUpdate(saved.getId(), updatedBy);
        
        return toResponseDTO(saved);
    }
    
    /**
     * Ajouter un utilisateur à un groupe
     */
    @Transactional
    public void addUserToGroup(Long groupId, Long userId, String performedBy) {
        log.info("Ajout utilisateur {} au groupe {} par {}", userId, groupId, performedBy);
        
        AssetGroup group = assetGroupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé: " + groupId));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + userId));
        
        group.addUser(user);
        assetGroupRepository.save(group);
        
        // Journaliser
        auditLogService.logUserAddedToGroup(groupId, userId, performedBy);
    }
    
    /**
     * Retirer un utilisateur d'un groupe
     */
    @Transactional
    public void removeUserFromGroup(Long groupId, Long userId, String performedBy) {
        log.info("Retrait utilisateur {} du groupe {} par {}", userId, groupId, performedBy);
        
        AssetGroup group = assetGroupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé: " + groupId));
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé: " + userId));
        
        group.removeUser(user);
        assetGroupRepository.save(group);
        
        // Journaliser
        auditLogService.logUserRemovedFromGroup(groupId, userId, performedBy);
    }
    
    /**
     * Ajouter un asset à un groupe
     */
    @Transactional
    public void addAssetToGroup(Long groupId, Long assetId, String performedBy) {
        log.info("Ajout asset {} au groupe {} par {}", assetId, groupId, performedBy);
        
        AssetGroup group = assetGroupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé: " + groupId));
        
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset non trouvé: " + assetId));
        
        group.addAsset(asset);
        assetGroupRepository.save(group);
        
        // Journaliser
        auditLogService.logAssetAddedToGroup(groupId, assetId, performedBy);
    }
    
    /**
     * Retirer un asset d'un groupe
     */
    @Transactional
    public void removeAssetFromGroup(Long groupId, Long assetId, String performedBy) {
        log.info("Retrait asset {} du groupe {} par {}", assetId, groupId, performedBy);
        
        AssetGroup group = assetGroupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé: " + groupId));
        
        Asset asset = assetRepository.findById(assetId)
            .orElseThrow(() -> new IllegalArgumentException("Asset non trouvé: " + assetId));
        
        group.removeAsset(asset);
        assetGroupRepository.save(group);
        
        // Journaliser
        auditLogService.logAssetRemovedFromGroup(groupId, assetId, performedBy);
    }
    
    /**
     * Récupérer tous les groupes
     */
    @Transactional(readOnly = true)
    public List<AssetGroupResponseDTO> getAllGroups() {
        return assetGroupRepository.findAll().stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les groupes accessibles par un utilisateur
     */
    @Transactional(readOnly = true)
    public List<AssetGroupResponseDTO> getGroupsByUser(Long userId) {
        return assetGroupRepository.findGroupsByUserId(userId).stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Récupérer un groupe par ID
     */
    @Transactional(readOnly = true)
    public AssetGroupResponseDTO getGroupById(Long id) {
        AssetGroup group = assetGroupRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé: " + id));
        return toResponseDTO(group);
    }
    
    /**
     * Supprimer un groupe
     */
    @Transactional
    public void deleteGroup(Long id, String performedBy) {
        log.info("Suppression du groupe {} par {}", id, performedBy);
        
        AssetGroup group = assetGroupRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Groupe non trouvé: " + id));
        
        // Vérifier que ce n'est pas le groupe "Non classé"
        if ("Non classé".equals(group.getName())) {
            throw new IllegalArgumentException("Le groupe 'Non classé' ne peut pas être supprimé");
        }
        
        // Déplacer les assets vers le groupe "Non classé"
        AssetGroup defaultGroup = assetGroupRepository.findByName("Non classé")
            .orElseThrow(() -> new IllegalStateException("Groupe 'Non classé' introuvable"));
        
        for (Asset asset : group.getAssets()) {
            asset.setAssetGroup(defaultGroup);
            assetRepository.save(asset);
        }
        
        assetGroupRepository.delete(group);
        
        // Journaliser
        auditLogService.logGroupDeletion(id, performedBy);
    }
    
    /**
     * Convertir AssetGroup en DTO de réponse
     */
    private AssetGroupResponseDTO toResponseDTO(AssetGroup group) {
        AssetGroupResponseDTO dto = new AssetGroupResponseDTO();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setPlmContainer(group.getPlmContainer());
        dto.setCreatedAt(group.getCreatedAt());
        dto.setCreatedBy(group.getCreatedBy());
        dto.setUpdatedAt(group.getUpdatedAt());
        dto.setUpdatedBy(group.getUpdatedBy());
        
        // Utilisateurs
        Set<AssetGroupResponseDTO.UserSummaryDTO> users = group.getUsers().stream()
            .map(user -> new AssetGroupResponseDTO.UserSummaryDTO(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().name()
            ))
            .collect(Collectors.toSet());
        dto.setUsers(users);
        dto.setUserCount(users.size());
        
        // Assets - Ne compter que les vrais assets (type = MANUAL)
        // Les assets issus de scans (CYBERWATCH, OPENVAS) sont des packages, pas des assets réels
        Set<AssetGroupResponseDTO.AssetSummaryDTO> assets = group.getAssets().stream()
            .filter(asset -> "MANUAL".equals(asset.getType()))
            .collect(Collectors.groupingBy(Asset::getName))
            .values().stream()
            .map(assetList -> {
                Asset asset = assetList.get(0);
                return new AssetGroupResponseDTO.AssetSummaryDTO(
                    asset.getId(),
                    asset.getName(),
                    asset.getSerialNumber(),
                    asset.getPartNumber(),
                    asset.getEnvironment()
                );
            })
            .collect(Collectors.toSet());
        dto.setAssets(assets);
        dto.setAssetCount(assets.size());
        
        return dto;
    }
}
