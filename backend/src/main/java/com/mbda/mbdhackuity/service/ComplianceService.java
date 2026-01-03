package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.ComplianceRuleDTO;
import com.mbda.mbdhackuity.dto.ComplianceStatsDTO;
import com.mbda.mbdhackuity.entity.ComplianceRule;
import com.mbda.mbdhackuity.repository.ComplianceRuleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ComplianceService {

    @Autowired
    private ComplianceRuleRepository complianceRuleRepository;
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @PostConstruct
    public void initializeSampleRules() {
        try {
            if (complianceRuleRepository.count() == 0) {
                createSampleRules();
            }
        } catch (Exception e) {
            // Table pas encore créée, ignorer
            System.out.println("⚠️  Table compliance_rules non trouvée. Exécutez le script SQL de création.");
        }
    }

    public List<ComplianceRuleDTO> getAllRules() {
        return complianceRuleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private ComplianceRuleDTO convertToDTO(ComplianceRule rule) {
        ComplianceRuleDTO dto = new ComplianceRuleDTO();
        dto.setId(rule.getId());
        dto.setReference(rule.getReference());
        dto.setName(rule.getName());
        dto.setDescription(rule.getDescription());
        dto.setFramework(rule.getFramework());
        dto.setLevel(rule.getLevel());
        dto.setStatus(rule.getStatus());
        dto.setLastCheck(rule.getLastChecked() != null ? rule.getLastChecked().format(FORMATTER) : "Jamais");
        dto.setRemediationSteps(rule.getRemediation());
        dto.setAffectedAssets(rule.getAffectedAssets());
        dto.setAutoCheck(rule.getAutomated());
        return dto;
    }

    public ComplianceStatsDTO getComplianceStats() {
        Long totalRules = complianceRuleRepository.count();
        Long compliantCount = complianceRuleRepository.countCompliant();
        Long nonCompliantCount = complianceRuleRepository.countNonCompliant();
        Long partialCount = complianceRuleRepository.countPartial();
        Long notCheckedCount = complianceRuleRepository.countNotChecked();
        
        // Calculate compliance rate (excluding not-checked)
        Long checked = totalRules - notCheckedCount;
        Double complianceRate = checked > 0 ? (compliantCount * 100.0 / checked) : 0.0;
        complianceRate = Math.round(complianceRate * 10.0) / 10.0; // Round to 1 decimal
        
        ComplianceStatsDTO stats = new ComplianceStatsDTO();
        stats.setTotalRules(totalRules);
        stats.setCompliantCount(compliantCount);
        stats.setNonCompliantCount(nonCompliantCount);
        stats.setPartialCount(partialCount);
        stats.setNotCheckedCount(notCheckedCount);
        stats.setComplianceRate(complianceRate);
        
        return stats;
    }

    private void createSampleRules() {
        // CIS Benchmarks
        complianceRuleRepository.save(new ComplianceRule(null, "CIS-Windows-10-1.1.1", 
            "Ensure 'Allow access to BitLocker-protected fixed data drives from earlier versions of Windows' is set to 'Disabled'",
            "Empêche l'accès aux lecteurs BitLocker depuis des versions antérieures de Windows",
            "CIS", "ÉLEVÉE", "non-compliant", 5, LocalDateTime.now().minusDays(2),
            "Configurer la stratégie de groupe : Computer Configuration\\Policies\\Administrative Templates\\Windows Components\\BitLocker Drive Encryption\\Fixed Data Drives",
            "System", true));

        complianceRuleRepository.save(new ComplianceRule(null, "CIS-Windows-11-1.1.2",
            "Ensure 'Allow enhanced PINs for startup' is set to 'Enabled'",
            "Permet l'utilisation de codes PIN renforcés pour le démarrage",
            "CIS", "MOYENNE", "compliant", 0, LocalDateTime.now().minusDays(1),
            "Configurer via GPO",
            "System", true));

        complianceRuleRepository.save(new ComplianceRule(null, "CIS-Windows-10-2.3.1.1",
            "Ensure 'Accounts: Administrator account status' is set to 'Disabled'",
            "Désactive le compte administrateur intégré pour renforcer la sécurité",
            "CIS", "CRITIQUE", "non-compliant", 12, LocalDateTime.now().minusDays(3),
            "Computer Configuration\\Policies\\Windows Settings\\Security Settings\\Local Policies\\Security Options",
            "System", true));

        // NIST
        complianceRuleRepository.save(new ComplianceRule(null, "NIST-AC-1",
            "Access Control Policy and Procedures",
            "Développer et maintenir une politique et des procédures de contrôle d'accès",
            "NIST", "CRITIQUE", "partial", 3, LocalDateTime.now().minusDays(5),
            "Documenter et implémenter des politiques de contrôle d'accès formelles",
            "System", false));

        complianceRuleRepository.save(new ComplianceRule(null, "NIST-AC-2",
            "Account Management",
            "Gérer les comptes système incluant création, activation, modification et suppression",
            "NIST", "ÉLEVÉE", "compliant", 0, LocalDateTime.now().minusDays(1),
            "Processus documenté de gestion du cycle de vie des comptes",
            "System", true));

        // ISO 27001
        complianceRuleRepository.save(new ComplianceRule(null, "ISO-27001-A.9.2.1",
            "User registration and de-registration",
            "Processus formels d'enregistrement et de désinscription des utilisateurs",
            "ISO", "ÉLEVÉE", "non-compliant", 8, LocalDateTime.now().minusDays(4),
            "Implémenter un processus formel de gestion des identités utilisateurs",
            "System", false));

        complianceRuleRepository.save(new ComplianceRule(null, "ISO-27001-A.12.6.1",
            "Management of technical vulnerabilities",
            "Obtenir des informations en temps utile sur les vulnérabilités techniques",
            "ISO", "CRITIQUE", "partial", 6, LocalDateTime.now().minusDays(2),
            "Établir un processus de veille et de gestion des vulnérabilités",
            "Application", true));

        // PCI-DSS
        complianceRuleRepository.save(new ComplianceRule(null, "PCI-DSS-2.1",
            "Always change vendor-supplied defaults",
            "Modifier tous les paramètres par défaut fournis par les fournisseurs",
            "PCI-DSS", "CRITIQUE", "non-compliant", 15, LocalDateTime.now().minusDays(7),
            "Changer tous les mots de passe, clés et paramètres par défaut",
            "System", true));

        complianceRuleRepository.save(new ComplianceRule(null, "PCI-DSS-6.2",
            "Ensure all system components are protected from known vulnerabilities",
            "Protéger tous les composants système contre les vulnérabilités connues",
            "PCI-DSS", "CRITIQUE", "partial", 22, LocalDateTime.now().minusDays(1),
            "Appliquer les patches de sécurité dans les 30 jours",
            "System", true));

        // GDPR
        complianceRuleRepository.save(new ComplianceRule(null, "GDPR-Art-32",
            "Security of processing",
            "Sécurité du traitement des données personnelles",
            "GDPR", "CRITIQUE", "compliant", 0, LocalDateTime.now(),
            "Implémenter des mesures techniques et organisationnelles appropriées",
            "Application", false));

        complianceRuleRepository.save(new ComplianceRule(null, "GDPR-Art-25",
            "Data protection by design and by default",
            "Protection des données dès la conception et par défaut",
            "GDPR", "ÉLEVÉE", "partial", 4, LocalDateTime.now().minusDays(3),
            "Intégrer la protection des données dans le cycle de développement",
            "Application", false));
    }
}
