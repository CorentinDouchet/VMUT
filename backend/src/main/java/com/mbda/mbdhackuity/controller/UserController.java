package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.user.CreateUserRequest;
import com.mbda.mbdhackuity.dto.user.UpdateUserRequest;
import com.mbda.mbdhackuity.dto.user.UserDTO;
import com.mbda.mbdhackuity.entity.Role;
import com.mbda.mbdhackuity.entity.User;
import com.mbda.mbdhackuity.repository.UserRepository;
import com.mbda.mbdhackuity.util.PasswordGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller pour la gestion des utilisateurs (CRUD)
 * Accessible uniquement par ADMINISTRATEUR et MAINTENANCE
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "Gestion des utilisateurs", description = "API de gestion des utilisateurs (CRUD)")
@PreAuthorize("hasAnyRole('ADMINISTRATEUR', 'MAINTENANCE')")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @GetMapping
    @Operation(summary = "Lister tous les utilisateurs")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userRepository.findAll().stream()
            .map(UserDTO::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un utilisateur par son ID")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(UserDTO::fromEntity)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    @Operation(summary = "Rechercher des utilisateurs", description = "Recherche par nom, email ou username")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam String query) {
        List<UserDTO> users = userRepository.searchUsers(query).stream()
            .map(UserDTO::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/role/{role}")
    @Operation(summary = "Récupérer les utilisateurs par rôle")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable Role role) {
        List<UserDTO> users = userRepository.findByRole(role).stream()
            .map(UserDTO::fromEntity)
            .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
    
    @PostMapping
    @Operation(summary = "Créer un nouvel utilisateur")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        
        // Vérifier si le username existe déjà
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Erreur : Le nom d'utilisateur existe déjà");
        }
        
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Erreur : L'email existe déjà");
        }
        
        // Générer un mot de passe robuste si non fourni
        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = PasswordGenerator.generateStrongPassword();
        }
        
        // Créer l'utilisateur
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(rawPassword))
            .role(request.getRole())
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .enabled(request.getEnabled() != null ? request.getEnabled() : true)
            .build();
        
        User savedUser = userRepository.save(user);
        
        // Retourner l'utilisateur créé avec le mot de passe en clair si généré automatiquement
        UserDTO userDTO = UserDTO.fromEntity(savedUser);
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            userDTO.setGeneratedPassword(rawPassword);
        }
        
        return ResponseEntity.ok(userDTO);
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un utilisateur")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        
        return userRepository.findById(id)
            .map(user -> {
                // Mettre à jour les champs si fournis
                if (request.getEmail() != null) {
                    // Vérifier si l'email n'est pas déjà utilisé par un autre user
                    if (userRepository.existsByEmail(request.getEmail()) && 
                        !user.getEmail().equals(request.getEmail())) {
                        return ResponseEntity.badRequest().body("Erreur : L'email existe déjà");
                    }
                    user.setEmail(request.getEmail());
                }
                
                if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                    user.setPassword(passwordEncoder.encode(request.getPassword()));
                }
                
                if (request.getRole() != null) {
                    user.setRole(request.getRole());
                }
                
                if (request.getFirstName() != null) {
                    user.setFirstName(request.getFirstName());
                }
                
                if (request.getLastName() != null) {
                    user.setLastName(request.getLastName());
                }
                
                if (request.getEnabled() != null) {
                    user.setEnabled(request.getEnabled());
                }
                
                User updatedUser = userRepository.save(user);
                return ResponseEntity.ok(UserDTO.fromEntity(updatedUser));
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un utilisateur")
    @PreAuthorize("hasRole('MAINTENANCE')") // Seul MAINTENANCE peut supprimer
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(user -> {
                userRepository.delete(user);
                return ResponseEntity.ok("Utilisateur supprimé avec succès");
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Activer/Désactiver un utilisateur")
    public ResponseEntity<UserDTO> toggleUserStatus(@PathVariable Long id) {
        return userRepository.findById(id)
            .map(user -> {
                user.setEnabled(!user.getEnabled());
                User updatedUser = userRepository.save(user);
                return ResponseEntity.ok(UserDTO.fromEntity(updatedUser));
            })
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Statistiques utilisateurs")
    public ResponseEntity<?> getUserStats() {
        long total = userRepository.count();
        long consultants = userRepository.countByRole(Role.CONSULTANT);
        long auteurs = userRepository.countByRole(Role.AUTEUR);
        long admins = userRepository.countByRole(Role.ADMINISTRATEUR);
        long maintenance = userRepository.countByRole(Role.MAINTENANCE);
        long enabled = userRepository.findByEnabledTrue().size();
        long disabled = userRepository.findByEnabledFalse().size();
        
        return ResponseEntity.ok(new UserStats(total, consultants, auteurs, admins, maintenance, enabled, disabled));
    }
    
    // Classe interne pour les statistiques
    public record UserStats(
        long total,
        long consultants,
        long auteurs,
        long administrateurs,
        long maintenance,
        long actifs,
        long inactifs
    ) {}
}
