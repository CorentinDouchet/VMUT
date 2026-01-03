package com.mbda.mbdhackuity.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Groupe d'assets pour cloisonnement fonctionnel (STB_REQ_0101)
 */
@Entity
@Table(name = "asset_groups")
public class AssetGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "plm_container")
    private String plmContainer; // Référence PLM (projet, domaine métier)
    
    @JsonIgnore
    @ManyToMany
    @JoinTable(
        name = "group_users",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> users = new HashSet<>();
    
    @JsonIgnore
    @OneToMany(mappedBy = "assetGroup")
    private Set<Asset> assets = new HashSet<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    // Constructeurs
    public AssetGroup() {
        this.createdAt = LocalDateTime.now();
    }
    
    public AssetGroup(String name, String description) {
        this();
        this.name = name;
        this.description = description;
    }
    
    // Getters et Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getPlmContainer() {
        return plmContainer;
    }
    
    public void setPlmContainer(String plmContainer) {
        this.plmContainer = plmContainer;
    }
    
    public Set<User> getUsers() {
        return users;
    }
    
    public void setUsers(Set<User> users) {
        this.users = users;
    }
    
    public Set<Asset> getAssets() {
        return assets;
    }
    
    public void setAssets(Set<Asset> assets) {
        this.assets = assets;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    // Méthodes utilitaires
    public void addUser(User user) {
        this.users.add(user);
        user.getGroups().add(this);
    }
    
    public void removeUser(User user) {
        this.users.remove(user);
        user.getGroups().remove(this);
    }
    
    public void addAsset(Asset asset) {
        this.assets.add(asset);
        asset.setAssetGroup(this);
    }
    
    public void removeAsset(Asset asset) {
        this.assets.remove(asset);
        asset.setAssetGroup(null);
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
