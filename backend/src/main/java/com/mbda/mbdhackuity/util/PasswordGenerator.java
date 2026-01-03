package com.mbda.mbdhackuity.util;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Utilitaire pour générer des mots de passe robustes et aléatoires.
 * <p>
 * Les mots de passe générés respectent les critères suivants :
 * - Longueur minimale : 16 caractères
 * - Contient au moins : 3 majuscules, 3 minuscules, 3 chiffres, 3 symboles
 * - Utilise SecureRandom pour une génération cryptographiquement sécurisée
 * </p>
 */
public class PasswordGenerator {

    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL = "!@#$%^&*()-_=+[]{}|;:,.<>?";
    
    private static final int MIN_LENGTH = 16;
    private static final int MIN_UPPERCASE = 3;
    private static final int MIN_LOWERCASE = 3;
    private static final int MIN_DIGITS = 3;
    private static final int MIN_SPECIAL = 3;
    
    private static final SecureRandom random = new SecureRandom();

    /**
     * Génère un mot de passe robuste aléatoire de 16 caractères.
     * 
     * @return Un mot de passe contenant majuscules, minuscules, chiffres et symboles
     */
    public static String generateStrongPassword() {
        return generateStrongPassword(MIN_LENGTH);
    }

    /**
     * Génère un mot de passe robuste aléatoire de longueur personnalisée.
     * 
     * @param length Longueur du mot de passe (min 16)
     * @return Un mot de passe contenant majuscules, minuscules, chiffres et symboles
     * @throws IllegalArgumentException si length < 16
     */
    public static String generateStrongPassword(int length) {
        if (length < MIN_LENGTH) {
            throw new IllegalArgumentException("Password length must be at least " + MIN_LENGTH);
        }

        List<Character> passwordChars = new ArrayList<>();

        // Ajouter le minimum requis de chaque type
        addRandomChars(passwordChars, UPPERCASE, MIN_UPPERCASE);
        addRandomChars(passwordChars, LOWERCASE, MIN_LOWERCASE);
        addRandomChars(passwordChars, DIGITS, MIN_DIGITS);
        addRandomChars(passwordChars, SPECIAL, MIN_SPECIAL);

        // Remplir le reste avec des caractères aléatoires de tous les types
        String allChars = UPPERCASE + LOWERCASE + DIGITS + SPECIAL;
        int remainingLength = length - passwordChars.size();
        addRandomChars(passwordChars, allChars, remainingLength);

        // Mélanger pour éviter un pattern prévisible
        Collections.shuffle(passwordChars, random);

        // Convertir en String
        StringBuilder password = new StringBuilder(length);
        for (Character c : passwordChars) {
            password.append(c);
        }

        return password.toString();
    }

    /**
     * Ajoute des caractères aléatoires depuis un ensemble donné.
     * 
     * @param list Liste à laquelle ajouter les caractères
     * @param charSet Ensemble de caractères source
     * @param count Nombre de caractères à ajouter
     */
    private static void addRandomChars(List<Character> list, String charSet, int count) {
        for (int i = 0; i < count; i++) {
            int index = random.nextInt(charSet.length());
            list.add(charSet.charAt(index));
        }
    }
}
