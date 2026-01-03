package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Moteur de templating pour documents DOCX
 * Gère le remplacement de placeholders du type {{key}} dans un template Word
 */
@Service
@Slf4j
public class DocxTemplateEngine {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Charge un template DOCX et remplace les placeholders
     * 
     * @param templatePath Chemin du fichier template
     * @param metadata Métadonnées à insérer (export_date, author, scope, etc.)
     * @param vulnerabilities Liste des vulnérabilités pour les tableaux
     * @param columns Colonnes à inclure dans le tableau
     * @return Document Word avec placeholders remplacés
     */
    public XWPFDocument processTemplate(String templatePath, 
                                       Map<String, String> metadata,
                                       List<VulnerabilityResult> vulnerabilities,
                                       List<String> columns) throws IOException {
        
        log.info("📄 Traitement du template: {}", templatePath);
        
        try (InputStream templateStream = new FileInputStream(templatePath)) {
            XWPFDocument document = new XWPFDocument(templateStream);
            
            // 1. Remplacer les placeholders simples dans les paragraphes
            replaceSimplePlaceholders(document, metadata);
            
            // 2. Gérer les placeholders de tableaux
            replaceTablePlaceholders(document, vulnerabilities, columns, metadata);
            
            log.info("✅ Template traité avec succès");
            return document;
        }
    }

    /**
     * Remplace les placeholders simples dans tous les paragraphes du document
     */
    private void replaceSimplePlaceholders(XWPFDocument document, Map<String, String> metadata) {
        log.debug("🔍 Remplacement des placeholders simples...");
        
        // Parcourir tous les paragraphes
        for (XWPFParagraph paragraph : document.getParagraphs()) {
            replacePlaceholdersInParagraph(paragraph, metadata);
        }
        
        // Parcourir les paragraphes dans les tableaux
        for (XWPFTable table : document.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph paragraph : cell.getParagraphs()) {
                        replacePlaceholdersInParagraph(paragraph, metadata);
                    }
                }
            }
        }
        
        // Parcourir les en-têtes et pieds de page
        for (XWPFHeader header : document.getHeaderList()) {
            for (XWPFParagraph paragraph : header.getParagraphs()) {
                replacePlaceholdersInParagraph(paragraph, metadata);
            }
        }
        
        for (XWPFFooter footer : document.getFooterList()) {
            for (XWPFParagraph paragraph : footer.getParagraphs()) {
                replacePlaceholdersInParagraph(paragraph, metadata);
            }
        }
        
        log.debug("✅ Placeholders simples remplacés");
    }

    /**
     * Remplace les placeholders dans un paragraphe en préservant le formatage
     */
    private void replacePlaceholdersInParagraph(XWPFParagraph paragraph, Map<String, String> metadata) {
        String text = paragraph.getText();
        if (text == null || text.isEmpty()) {
            return;
        }
        
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(text);
        if (!matcher.find()) {
            return;
        }
        
        // Reconstruire le texte en remplaçant les placeholders
        String newText = text;
        matcher.reset();
        while (matcher.find()) {
            String placeholder = matcher.group(0); // {{key}}
            String key = matcher.group(1).trim(); // key
            String value = metadata.getOrDefault(key, "");
            newText = newText.replace(placeholder, value);
        }
        
        // Remplacer tout le contenu en préservant le style du premier run
        if (!newText.equals(text)) {
            List<XWPFRun> runs = paragraph.getRuns();
            if (!runs.isEmpty()) {
                // Garder le style du premier run
                XWPFRun firstRun = runs.get(0);
                String fontFamily = firstRun.getFontFamily();
                int fontSize = firstRun.getFontSize();
                boolean isBold = firstRun.isBold();
                boolean isItalic = firstRun.isItalic();
                
                // Supprimer tous les runs
                for (int i = runs.size() - 1; i >= 0; i--) {
                    paragraph.removeRun(i);
                }
                
                // Créer un nouveau run avec le texte remplacé
                XWPFRun newRun = paragraph.createRun();
                newRun.setText(newText);
                if (fontFamily != null) {
                    newRun.setFontFamily(fontFamily);
                }
                if (fontSize > 0) {
                    newRun.setFontSize(fontSize);
                }
                newRun.setBold(isBold);
                newRun.setItalic(isItalic);
            }
        }
    }

    /**
     * Gère les placeholders de tableaux ({{vuln_table}}, {{summary_table}})
     */
    private void replaceTablePlaceholders(XWPFDocument document, 
                                         List<VulnerabilityResult> vulnerabilities,
                                         List<String> columns,
                                         Map<String, String> metadata) {
        log.debug("📊 Traitement des placeholders de tableaux...");
        
        List<XWPFParagraph> paragraphs = document.getParagraphs();
        
        for (int i = 0; i < paragraphs.size(); i++) {
            XWPFParagraph paragraph = paragraphs.get(i);
            String text = paragraph.getText();
            
            if (text != null && text.contains("{{vuln_table}}")) {
                log.info("🎯 Placeholder {{vuln_table}} trouvé, insertion du tableau...");
                
                // Vérifier s'il y a un tableau juste après ce paragraphe
                XWPFTable existingTable = findNextTable(document, i);
                
                if (existingTable != null) {
                    // Utiliser le tableau existant comme modèle
                    log.debug("📋 Utilisation du tableau existant comme modèle");
                    populateExistingTable(existingTable, vulnerabilities, columns);
                } else {
                    // Créer un nouveau tableau après le paragraphe
                    log.debug("🆕 Création d'un nouveau tableau");
                    int posIndex = document.getPosOfParagraph(paragraph);
                    XWPFTable newTable = document.createTable();
                    // Déplacer le nouveau tableau à la bonne position si possible
                    createVulnerabilityTable(newTable, vulnerabilities, columns);
                }
                
                // Supprimer le placeholder
                paragraph.removeRun(0);
            } else if (text != null && text.contains("{{summary_stats}}")) {
                log.info("📈 Placeholder {{summary_stats}} trouvé");
                createSummaryTable(document, i, vulnerabilities, metadata);
                paragraph.removeRun(0);
            }
        }
        
        log.debug("✅ Placeholders de tableaux traités");
    }

    /**
     * Trouve le prochain tableau après un paragraphe donné
     */
    private XWPFTable findNextTable(XWPFDocument document, int paragraphIndex) {
        List<IBodyElement> bodyElements = document.getBodyElements();
        
        for (int i = 0; i < bodyElements.size(); i++) {
            IBodyElement element = bodyElements.get(i);
            if (element instanceof XWPFParagraph) {
                XWPFParagraph p = (XWPFParagraph) element;
                if (document.getPosOfParagraph(p) == paragraphIndex) {
                    // Chercher le prochain élément
                    if (i + 1 < bodyElements.size() && bodyElements.get(i + 1) instanceof XWPFTable) {
                        return (XWPFTable) bodyElements.get(i + 1);
                    }
                    break;
                }
            }
        }
        return null;
    }

    /**
     * Remplit un tableau existant avec les données de vulnérabilités
     */
    private void populateExistingTable(XWPFTable table, List<VulnerabilityResult> vulnerabilities, List<String> columns) {
        // La première ligne est supposée être l'en-tête (à conserver)
        if (table.getRows().isEmpty()) {
            createVulnerabilityTable(table, vulnerabilities, columns);
            return;
        }
        
        XWPFTableRow headerRow = table.getRow(0);
        
        // Supprimer les lignes existantes (sauf l'en-tête)
        for (int i = table.getRows().size() - 1; i > 0; i--) {
            table.removeRow(i);
        }
        
        // Ajouter les données
        for (VulnerabilityResult vuln : vulnerabilities) {
            XWPFTableRow row = table.createRow();
            
            for (int colIndex = 0; colIndex < columns.size(); colIndex++) {
                String column = columns.get(colIndex);
                String value = extractColumnValue(vuln, column);
                
                XWPFTableCell cell = row.getCell(colIndex);
                if (cell == null) {
                    cell = row.addNewTableCell();
                }
                
                cell.setText(value);
            }
        }
    }

    /**
     * Crée un nouveau tableau de vulnérabilités
     */
    private void createVulnerabilityTable(XWPFTable table, List<VulnerabilityResult> vulnerabilities, List<String> columns) {
        // Créer l'en-tête
        XWPFTableRow headerRow = table.getRow(0);
        if (headerRow == null) {
            headerRow = table.createRow();
        }
        
        Map<String, String> columnHeaders = Map.of(
            "cve", "CVE",
            "technology", "Technologie",
            "version", "Version",
            "score", "Score CVSS",
            "severity", "Sévérité",
            "rssiStatus", "Statut RSSI",
            "metierStatus", "Statut Métier",
            "comment", "Commentaire"
        );
        
        for (int i = 0; i < columns.size(); i++) {
            XWPFTableCell cell = i == 0 ? headerRow.getCell(0) : headerRow.addNewTableCell();
            String header = columnHeaders.getOrDefault(columns.get(i), columns.get(i));
            cell.setText(header);
            
            // Style de l'en-tête
            XWPFParagraph paragraph = cell.getParagraphs().get(0);
            XWPFRun run = paragraph.getRuns().isEmpty() ? paragraph.createRun() : paragraph.getRuns().get(0);
            run.setBold(true);
        }
        
        // Ajouter les données
        for (VulnerabilityResult vuln : vulnerabilities) {
            XWPFTableRow row = table.createRow();
            
            for (int colIndex = 0; colIndex < columns.size(); colIndex++) {
                String column = columns.get(colIndex);
                String value = extractColumnValue(vuln, column);
                row.getCell(colIndex).setText(value);
            }
        }
    }

    /**
     * Crée un tableau de statistiques
     */
    private void createSummaryTable(XWPFDocument document, int position, 
                                   List<VulnerabilityResult> vulnerabilities,
                                   Map<String, String> metadata) {
        // Compter les vulnérabilités par sévérité
        long critical = vulnerabilities.stream()
            .filter(v -> "CRITICAL".equalsIgnoreCase(v.getBaseSeverity()))
            .count();
        long high = vulnerabilities.stream()
            .filter(v -> "HIGH".equalsIgnoreCase(v.getBaseSeverity()))
            .count();
        long medium = vulnerabilities.stream()
            .filter(v -> "MEDIUM".equalsIgnoreCase(v.getBaseSeverity()))
            .count();
        long low = vulnerabilities.stream()
            .filter(v -> "LOW".equalsIgnoreCase(v.getBaseSeverity()))
            .count();
        
        XWPFTable table = document.createTable(5, 2);
        
        // En-tête
        table.getRow(0).getCell(0).setText("Sévérité");
        table.getRow(0).getCell(1).setText("Nombre");
        
        // Données
        table.getRow(1).getCell(0).setText("Critique");
        table.getRow(1).getCell(1).setText(String.valueOf(critical));
        table.getRow(2).getCell(0).setText("Élevée");
        table.getRow(2).getCell(1).setText(String.valueOf(high));
        table.getRow(3).getCell(0).setText("Moyenne");
        table.getRow(3).getCell(1).setText(String.valueOf(medium));
        table.getRow(4).getCell(0).setText("Faible");
        table.getRow(4).getCell(1).setText(String.valueOf(low));
    }

    /**
     * Extrait la valeur d'une colonne depuis une vulnérabilité
     */
    private String extractColumnValue(VulnerabilityResult vuln, String column) {
        return switch (column) {
            case "cve" -> vuln.getCveId() != null ? vuln.getCveId() : "";
            case "technology" -> vuln.getPackageName() != null ? vuln.getPackageName() : "";
            case "version" -> vuln.getPackageVersion() != null ? vuln.getPackageVersion() : "";
            case "score" -> vuln.getBaseScore() != null ? vuln.getBaseScore().toString() : "";
            case "severity" -> vuln.getBaseSeverity() != null ? vuln.getBaseSeverity() : "";
            case "scoreContext" -> vuln.getModifiedScore() != null ? vuln.getModifiedScore().toString() : "";
            case "rssiStatus" -> vuln.getRssiStatus() != null ? vuln.getRssiStatus() : "";
            case "metierStatus" -> vuln.getMetierStatus() != null ? vuln.getMetierStatus() : "";
            case "comment" -> vuln.getCommentsAnalyst() != null ? vuln.getCommentsAnalyst() : "";
            case "scanName" -> vuln.getScanName() != null ? vuln.getScanName() : "";
            case "publishedDate" -> vuln.getPublishedDate() != null ? 
                vuln.getPublishedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
            default -> "";
        };
    }
}
