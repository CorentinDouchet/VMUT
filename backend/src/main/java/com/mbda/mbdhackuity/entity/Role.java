package com.mbda.mbdhackuity.entity;

/**
 * Énumération des rôles utilisateurs avec leurs permissions associées
 */
public enum Role {
    /**
     * CONSULTANT : Accès en lecture seule
     * - Visualisation des vulnérabilités
     * - Génération de rapports
     */
    CONSULTANT,
    
    /**
     * AUTEUR : Analyste opérationnel
     * - Visualisation des vulnérabilités
     * - Import de fichiers de scan
     * - Justification des vulnérabilités (commentaires)
     * - Révision du score CVSS
     * - Changement de statuts RSSI/Métier
     * - Génération de rapports
     */
    AUTEUR,
    
    /**
     * ADMINISTRATEUR : Gestion des utilisateurs et périmètres
     * - Visualisation des vulnérabilités
     * - Génération de rapports
     * - Gestion des utilisateurs (créer, modifier, désactiver)
     * - Gestion des groupes d'assets
     */
    ADMINISTRATEUR,
    
    /**
     * MAINTENANCE : Super administrateur (tous les droits)
     * - Tous les droits sans restriction
     * - Accès au journal d'audit
     * - Gestion de l'encyclopédie CVE (import CVE/CPE)
     */
    MAINTENANCE
}
