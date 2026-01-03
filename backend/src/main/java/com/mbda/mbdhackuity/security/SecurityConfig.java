package com.mbda.mbdhackuity.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Configuration de la sécurité Spring Security avec JWT
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Autowired
    private CustomUserDetailsService userDetailsService;
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // CORS preflight requests (OPTIONS)
                .requestMatchers(request -> "OPTIONS".equals(request.getMethod())).permitAll()
                
                // Endpoints publics (authentification)
                .requestMatchers("/api/auth/**").permitAll()
                
                // Swagger/OpenAPI (public pour dev, à sécuriser en prod)
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                
                // Actuator (monitoring)
                .requestMatchers("/actuator/**").hasRole("MAINTENANCE")
                
                // Journal d'audit : MAINTENANCE uniquement
                .requestMatchers("/api/audit/**").hasRole("MAINTENANCE")
                
                // Encyclopédie CVE : MAINTENANCE uniquement
                .requestMatchers("/api/cve/import/**", "/api/cpe/import/**").hasRole("MAINTENANCE")
                .requestMatchers("/api/admin/**").hasRole("MAINTENANCE")
                
                // Gestion des utilisateurs : ADMINISTRATEUR ou MAINTENANCE
                .requestMatchers("/api/users/**").hasAnyRole("ADMINISTRATEUR", "MAINTENANCE")
                
                // Gestion des groupes d'assets : ADMINISTRATEUR pour CRUD, AUTEUR pour assignment
                .requestMatchers("/api/groups/my-groups").authenticated()
                .requestMatchers("/api/groups/*/assets/**").hasAnyRole("AUTEUR", "ADMINISTRATEUR", "MAINTENANCE")
                .requestMatchers("/api/groups/**").hasAnyRole("ADMINISTRATEUR", "MAINTENANCE")
                
                // Import de scans : AUTEUR ou MAINTENANCE
                .requestMatchers("/api/scans/import/**").hasAnyRole("AUTEUR", "MAINTENANCE")
                
                // Modification de vulnérabilités (commentaires, CVSS, statuts) : AUTEUR ou MAINTENANCE
                .requestMatchers("/api/vulnerabilities/*/comment-analyst").hasAnyRole("AUTEUR", "MAINTENANCE")
                .requestMatchers("/api/vulnerabilities/*/rssi-status").hasAnyRole("AUTEUR", "MAINTENANCE")
                .requestMatchers("/api/vulnerabilities/*/metier-status").hasAnyRole("AUTEUR", "MAINTENANCE")
                .requestMatchers("/api/cvss/**").hasAnyRole("AUTEUR", "MAINTENANCE")
                
                // Export de rapports : tous sauf lecture seule peuvent exporter
                .requestMatchers("/api/export/**").hasAnyRole("CONSULTANT", "AUTEUR", "ADMINISTRATEUR", "MAINTENANCE")
                
                // Lecture des vulnérabilités et données : tous les rôles
                .requestMatchers("/api/vulnerabilities/**").authenticated()
                .requestMatchers("/api/scans/**").authenticated()
                .requestMatchers("/api/assets/**").authenticated()
                .requestMatchers("/api/cve/**").authenticated()
                .requestMatchers("/api/cves/**").authenticated()
                .requestMatchers("/api/cwe/**").authenticated()
                .requestMatchers("/api/cvss/**").authenticated()
                .requestMatchers("/api/history/**").authenticated()
                .requestMatchers("/api/dashboard/**").authenticated()
                .requestMatchers("/api/security-defaults/**").authenticated()
                .requestMatchers("/api/scan-import/**").authenticated()
                .requestMatchers("/api/compliance/**").authenticated()
                .requestMatchers("/api/corrective-actions/**").authenticated()
                
                // Actions correctives : tous les utilisateurs
                .requestMatchers("/api/actions-correctives/**").authenticated()
                
                // CPE Mappings : AUTEUR, ADMINISTRATEUR ou MAINTENANCE
                .requestMatchers("/api/cpe-mappings/**").hasAnyRole("AUTEUR", "ADMINISTRATEUR", "MAINTENANCE")
                
                // Toutes les autres requêtes nécessitent une authentification
                .anyRequest().authenticated()
            );
        
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
