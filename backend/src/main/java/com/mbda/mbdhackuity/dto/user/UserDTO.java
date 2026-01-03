package com.mbda.mbdhackuity.dto.user;

import com.mbda.mbdhackuity.entity.Role;
import com.mbda.mbdhackuity.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour la réponse contenant les informations utilisateur
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    
    private Long id;
    private String username;
    private String email;
    private Role role;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private String firstName;
    private String lastName;
    private String fullName;
    
    // Mot de passe en clair (seulement rempli lors de la création avec génération automatique)
    private String generatedPassword;
    
    /**
     * Convertit une entité User en UserDTO
     */
    public static UserDTO fromEntity(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .enabled(user.getEnabled())
            .createdAt(user.getCreatedAt())
            .lastLogin(user.getLastLogin())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .fullName(user.getFullName())
            .build();
    }
}
