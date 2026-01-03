package com.mbda.mbdhackuity.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilitaire pour générer des hashs BCrypt de mots de passe
 * Usage: java PasswordHasher <motdepasse>
 */
public class PasswordHasher {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Usage: java PasswordHasher <motdepasse>");
            System.exit(1);
        }
        
        String password = args[0];
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(password);
        
        System.out.println("=".repeat(80));
        System.out.println("Mot de passe : " + password);
        System.out.println("Hash BCrypt  : " + hash);
        System.out.println("=".repeat(80));
        System.out.println("\nCopiez ce hash dans votre script SQL :");
        System.out.println("'" + hash + "'");
    }
}
