package com.mbda.mbdhackuity.controller;

import com.mbda.mbdhackuity.dto.auth.JwtResponse;
import com.mbda.mbdhackuity.dto.auth.LoginRequest;
import com.mbda.mbdhackuity.entity.User;
import com.mbda.mbdhackuity.repository.UserRepository;
import com.mbda.mbdhackuity.security.CustomUserDetails;
import com.mbda.mbdhackuity.security.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pour l'authentification (login, logout)
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentification", description = "API d'authentification JWT")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/login")
    @Operation(summary = "Se connecter", description = "Authentifie l'utilisateur et retourne un token JWT")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        
        // Debug logs
        System.out.println("=== LOGIN ATTEMPT ===");
        System.out.println("Username: " + loginRequest.getUsername());
        System.out.println("Password length: " + (loginRequest.getPassword() != null ? loginRequest.getPassword().length() : "null"));
        System.out.println("=====================");
        
        // Authentifier l'utilisateur
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            )
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        // Générer le token JWT
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        // Récupérer les infos utilisateur
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        
        // Mettre à jour la date de dernière connexion
        userRepository.findByUsername(userDetails.getUsername())
            .ifPresent(user -> {
                user.updateLastLogin();
                userRepository.save(user);
            });
        
        // Récupérer le rôle (sans le préfixe ROLE_)
        String role = userDetails.getAuthorities().stream()
            .findFirst()
            .map(auth -> auth.getAuthority().replace("ROLE_", ""))
            .orElse("");
        
        // Récupérer le fullName
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        String fullName = user != null ? user.getFullName() : userDetails.getUsername();
        
        return ResponseEntity.ok(new JwtResponse(
            jwt,
            userDetails.getId(),
            userDetails.getUsername(),
            userDetails.getEmail(),
            role,
            fullName
        ));
    }
    
    @PostMapping("/logout")
    @Operation(summary = "Se déconnecter", description = "Déconnecte l'utilisateur (côté client)")
    public ResponseEntity<?> logout() {
        // Avec JWT, la déconnexion se fait côté client en supprimant le token
        return ResponseEntity.ok("Déconnexion réussie");
    }
    
    @GetMapping("/me")
    @Operation(summary = "Récupérer les infos de l'utilisateur connecté")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Non authentifié");
        }
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        String role = userDetails.getAuthorities().stream()
            .findFirst()
            .map(auth -> auth.getAuthority().replace("ROLE_", ""))
            .orElse("");
        
        return ResponseEntity.ok(new JwtResponse(
            null, // Pas de nouveau token
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            role,
            user.getFullName()
        ));
    }
}
