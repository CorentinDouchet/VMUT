package com.mbda.mbdhackuity.dto.user;

import com.mbda.mbdhackuity.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO pour créer un nouvel utilisateur
 */
@Data
public class CreateUserRequest {
    
    @NotBlank(message = "Le nom d'utilisateur est obligatoire")
    @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères")
    private String username;
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    private String email;
    
    // Mot de passe optionnel : si non fourni, un mot de passe robuste sera généré automatiquement
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String password;
    
    @NotNull(message = "Le rôle est obligatoire")
    private Role role;
    
    private String firstName;
    private String lastName;
    
    private Boolean enabled = true;
}
