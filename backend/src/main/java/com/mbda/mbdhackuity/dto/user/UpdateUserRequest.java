package com.mbda.mbdhackuity.dto.user;

import com.mbda.mbdhackuity.entity.Role;
import jakarta.validation.constraints.Email;
import lombok.Data;

/**
 * DTO pour mettre à jour un utilisateur existant
 */
@Data
public class UpdateUserRequest {
    
    @Email(message = "L'email doit être valide")
    private String email;
    
    private String password; // Optionnel, seulement si changement
    
    private Role role;
    
    private String firstName;
    private String lastName;
    
    private Boolean enabled;
}
