package com.mbda.mbdhackuity.service;

import com.mbda.mbdhackuity.dto.VulnerabilityExportRequest;
import com.mbda.mbdhackuity.entity.VulnerabilityResult;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ExportService {

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AssetService assetService;

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private DocxTemplateEngine templateEngine;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH'h'mm");

    private static final List<String> DEFAULT_COLUMNS = List.of(
            "cve", "technology", "version", "score", "severity", "scoreContext", "vectorBase",
            "vectorEnv", "cwe", "cweDesc", "rssiStatus", "metierStatus", "comment",
            "used", "scanName", "assetGroups", "publishedDate", "lastScanDate", "obsolete"
    );

    private final Map<String, String> columnHeaders = new LinkedHashMap<>() {{
        put("cve", "Vulnérabilité (CVE)");
        put("scanName", "Actif / Scan");
        put("assetGroups", "Groupes de l'actif");
        put("publishedDate", "Date de publication");
        put("lastScanDate", "Dernière analyse");
        put("technology", "Technologie");
        put("version", "Version");
        put("cwe", "CWE");
        put("cweDesc", "Description CWE");
        put("severity", "Sévérité");
        put("score", "Score CVSS");
        put("scoreContext", "Score CVSS contextualisé");
        put("vectorBase", "Vecteur CVSS base");
        put("vectorEnv", "Vecteur CVSS env.");
        put("rssiStatus", "Statut RSSI");
        put("metierStatus", "Statut métier");
        put("comment", "Commentaires analyste");
        put("used", "Utilisé");
        put("epss", "Score EPSS");
        put("priority", "Prioritaire");
        put("obsolete", "Obsolète");
        put("endOfSupport", "Fin de support");
        put("endOfLife", "Fin de vie");
    }};

    private final Map<String, Function<VulnerabilityResult, String>> columnExtractors = new LinkedHashMap<>() {{
        put("cve", v -> safe(v.getCveId()));
        put("scanName", v -> safe(v.getScanName()));
        put("assetGroups", v -> safe(v.getAssetGroups()));
        put("publishedDate", v -> v.getPublishedDate() != null ? v.getPublishedDate().format(DATE_FORMAT) : "");
        put("lastScanDate", v -> v.getLastScanDate() != null ? v.getLastScanDate().format(DATE_TIME_FORMAT) : "");
        put("technology", v -> safe(v.getPackageName()));
        put("version", v -> safe(v.getPackageVersion()));
        put("cwe", v -> safe(v.getCwe()));
        put("cweDesc", v -> safe(v.getCveDescription()));
        put("severity", v -> safe(v.getBaseSeverity()));
        put("score", v -> toStringScore(v.getBaseScore()));
        put("scoreContext", v -> toStringScore(v.getModifiedScore()));
        put("vectorBase", v -> safe(v.getVectorString()));
        put("vectorEnv", v -> safe(v.getModifiedVector()));
        put("rssiStatus", v -> safe(v.getRssiStatus()));
        put("metierStatus", v -> safe(v.getMetierStatus()));
        put("comment", v -> safe(v.getCommentsAnalyst()));
        put("used", v -> safe(v.getValidityStatus()));
        put("epss", v -> v.getEpssScore() != null ? formatEpss(v.getEpssScore()) : "");
        put("priority", v -> v.getIsPriority() != null && v.getIsPriority() ? "Oui" : "Non");
        put("obsolete", v -> "Non"); // Sera enrichi dynamiquement
        put("endOfSupport", v -> ""); // Sera enrichi dynamiquement
        put("endOfLife", v -> ""); // Sera enrichi dynamiquement
    }};

    /**
     * Export principal pour les vulnérabilités consolidées.
     */
    public ExportPayload exportVulnerabilities(VulnerabilityExportRequest request) {
        String format = Optional.ofNullable(request.getFormat()).orElse("CSV").toUpperCase(Locale.ROOT);
        List<VulnerabilityResult> vulns = assetService.getConsolidatedVulnerabilitiesByAssetName(request.getAssetName());
        List<VulnerabilityResult> filtered = applyFilters(vulns, request.getFilters());

        List<String> columns = resolveColumns(request.getColumns());
        ReportMetadata metadata = buildMetadata(request, filtered.size());

        return switch (format) {
            case "EXCEL", "XLSX" -> new ExportPayload(
                    buildExcel(filtered, columns, metadata),
                    metadata.fileName("xlsx"),
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                    format
            );
            case "DOCX", "WORD" -> new ExportPayload(
                    buildWord(filtered, columns, metadata, request.getTemplateName()),
                    metadata.fileName("docx"),
                    MediaType.APPLICATION_OCTET_STREAM,
                    format
            );
            case "PDF" -> new ExportPayload(
                    buildPdf(filtered, columns, metadata),
                    metadata.fileName("pdf"),
                    MediaType.APPLICATION_PDF,
                    format
            );
            default -> new ExportPayload(
                    buildCsv(filtered, columns, metadata),
                    metadata.fileName("csv"),
                    MediaType.parseMediaType("text/csv"),
                    "CSV"
            );
        };
    }

    // ---------------------------------------------------------------------
    // Builders
    // ---------------------------------------------------------------------

    private Resource buildCsv(List<VulnerabilityResult> vulns, List<String> columns, ReportMetadata metadata) {
        StringBuilder csv = new StringBuilder();
        csv.append("\"sep=,\"\n");
        csv.append("Date d'export,Identifiant export,Auteur,Périmètre,Version CVE,Enregistrements\n");
        csv.append(String.join(",", List.of(
                escapeCsv(metadata.generatedAt().format(DATE_TIME_FORMAT)),
                escapeCsv(metadata.exportId()),
                escapeCsv(metadata.requestedBy()),
                escapeCsv(metadata.scope()),
                escapeCsv(metadata.cveDbVersion()),
                String.valueOf(metadata.recordCount())
        ))).append("\n\n");

        csv.append(columns.stream().map(c -> escapeCsv(columnHeaders.getOrDefault(c, c)))
                .collect(Collectors.joining(","))).append("\n");

        for (VulnerabilityResult v : vulns) {
            String line = columns.stream()
                    .map(col -> escapeCsv(columnExtractors.getOrDefault(col, vv -> "").apply(v)))
                    .collect(Collectors.joining(","));
            csv.append(line).append("\n");
        }

        auditLogService.logExport(metadata.requestedBy(), "CSV", metadata.fileName("csv"), vulns.size());
        return new ByteArrayResource(Objects.requireNonNull(csv.toString().getBytes(StandardCharsets.UTF_8)));
    }

    private Resource buildExcel(List<VulnerabilityResult> vulns, List<String> columns, ReportMetadata metadata) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Vulnérabilités");

            // Metadata block
            Row metaRow1 = sheet.createRow(0);
            metaRow1.createCell(0).setCellValue("Date d'export");
            metaRow1.createCell(1).setCellValue(metadata.generatedAt().format(DATE_TIME_FORMAT));
            Row metaRow2 = sheet.createRow(1);
            metaRow2.createCell(0).setCellValue("Identifiant");
            metaRow2.createCell(1).setCellValue(metadata.exportId());
            Row metaRow3 = sheet.createRow(2);
            metaRow3.createCell(0).setCellValue("Auteur");
            metaRow3.createCell(1).setCellValue(metadata.requestedBy());
            Row metaRow4 = sheet.createRow(3);
            metaRow4.createCell(0).setCellValue("Périmètre");
            metaRow4.createCell(1).setCellValue(metadata.scope());
            Row metaRow5 = sheet.createRow(4);
            metaRow5.createCell(0).setCellValue("Version base CVE");
            metaRow5.createCell(1).setCellValue(metadata.cveDbVersion());

            int startRow = 6;
            Row header = sheet.createRow(startRow);
            for (int i = 0; i < columns.size(); i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columnHeaders.getOrDefault(columns.get(i), columns.get(i)));
            }

            for (int r = 0; r < vulns.size(); r++) {
                Row row = sheet.createRow(startRow + 1 + r);
                VulnerabilityResult v = vulns.get(r);
                for (int c = 0; c < columns.size(); c++) {
                    Cell cell = row.createCell(c);
                    cell.setCellValue(columnExtractors.getOrDefault(columns.get(c), vv -> "").apply(v));
                }
            }

            for (int i = 0; i < columns.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            auditLogService.logExport(metadata.requestedBy(), "EXCEL", metadata.fileName("xlsx"), vulns.size());
            return new ByteArrayResource(Objects.requireNonNull(out.toByteArray()));
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la génération Excel", e);
        }
    }

    private Resource buildWord(List<VulnerabilityResult> vulns, List<String> columns,
                               ReportMetadata metadata, String templateName) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            XWPFDocument document;
            
            // Si un template est spécifié, utiliser le moteur de templates
            if (templateName != null && !templateName.isBlank()) {
                String templatePath = resolveTemplatePath(templateName);
                
                // Préparer les métadonnées pour le remplacement
                Map<String, String> templateMetadata = new LinkedHashMap<>();
                templateMetadata.put("export_date", metadata.generatedAt().format(DATE_TIME_FORMAT));
                templateMetadata.put("export_id", metadata.exportId());
                templateMetadata.put("author", metadata.requestedBy());
                templateMetadata.put("scope", metadata.scope());
                templateMetadata.put("cve_version", metadata.cveDbVersion());
                templateMetadata.put("record_count", String.valueOf(metadata.recordCount()));
                templateMetadata.put("asset_name", metadata.assetName() != null ? metadata.assetName() : "");
                templateMetadata.put("total_vulnerabilities", String.valueOf(vulns.size()));
                
                // Utiliser le moteur de templates
                document = templateEngine.processTemplate(templatePath, templateMetadata, vulns, columns);
            } else {
                // Génération classique sans template
                document = new XWPFDocument();

                XWPFParagraph title = document.createParagraph();
                title.setAlignment(ParagraphAlignment.LEFT);
                XWPFRun titleRun = title.createRun();
                titleRun.setText("Rapport vulnérabilités - " + metadata.scope());
                titleRun.setBold(true);
                titleRun.setFontSize(16);
                titleRun.addBreak();

                XWPFParagraph meta = document.createParagraph();
                XWPFRun metaRun = meta.createRun();
                metaRun.setText("Date: " + metadata.generatedAt().format(DATE_TIME_FORMAT));
                metaRun.addBreak();
                metaRun.setText("Identifiant: " + metadata.exportId());
                metaRun.addBreak();
                metaRun.setText("Auteur: " + metadata.requestedBy());
                metaRun.addBreak();
                metaRun.setText("Périmètre: " + metadata.scope());
                metaRun.addBreak();
                metaRun.setText("Version base CVE: " + metadata.cveDbVersion());
                metaRun.addBreak();
                metaRun.addBreak();

                XWPFTable table = document.createTable();
                XWPFTableRow header = table.getRow(0);
                header.getCell(0).setText(columnHeaders.getOrDefault(columns.get(0), columns.get(0)));
                for (int i = 1; i < columns.size(); i++) {
                    header.addNewTableCell().setText(columnHeaders.getOrDefault(columns.get(i), columns.get(i)));
                }

                for (VulnerabilityResult v : vulns) {
                    XWPFTableRow row = table.createRow();
                    for (int i = 0; i < columns.size(); i++) {
                        row.getCell(i).setText(columnExtractors.getOrDefault(columns.get(i), vv -> "").apply(v));
                    }
                }
            }

            document.write(out);
            auditLogService.logExport(metadata.requestedBy(), "DOCX", metadata.fileName("docx"), vulns.size());
            return new ByteArrayResource(Objects.requireNonNull(out.toByteArray()));
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la génération du document Word", e);
        }
    }

    private Resource buildPdf(List<VulnerabilityResult> vulns, List<String> columns, ReportMetadata metadata) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDDocumentInformation info = document.getDocumentInformation();
            info.setAuthor(metadata.requestedBy());
            info.setTitle("Rapport vulnérabilités - " + metadata.scope());

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float margin = 40;
                float y = page.getMediaBox().getHeight() - margin;

                content.setFont(PDType1Font.HELVETICA_BOLD, 14);
                content.beginText();
                content.newLineAtOffset(margin, y);
                content.showText("Rapport vulnérabilités - " + metadata.scope());
                content.endText();
                y -= 20;

                content.setFont(PDType1Font.HELVETICA, 9);
                List<String> metaLines = List.of(
                        "Date: " + metadata.generatedAt().format(DATE_TIME_FORMAT),
                        "Identifiant: " + metadata.exportId(),
                        "Auteur: " + metadata.requestedBy(),
                        "Version base CVE: " + metadata.cveDbVersion(),
                        "Enregistrements: " + metadata.recordCount()
                );
                for (String line : metaLines) {
                    content.beginText();
                    content.newLineAtOffset(margin, y);
                    content.showText(line);
                    content.endText();
                    y -= 12;
                }
                y -= 6;

                // Simple table rendering
                float tableWidth = page.getMediaBox().getWidth() - 2 * margin;
                float rowHeight = 14;
                float textX = margin + 2;
                float textY = y;
                content.setFont(PDType1Font.HELVETICA_BOLD, 8);
                for (int i = 0; i < columns.size(); i++) {
                    content.beginText();
                    content.newLineAtOffset(textX, textY);
                    content.showText(shorten(columnHeaders.getOrDefault(columns.get(i), columns.get(i)), 25));
                    content.endText();
                    textX += tableWidth / columns.size();
                }
                textY -= rowHeight;
                content.setFont(PDType1Font.HELVETICA, 8);

                for (VulnerabilityResult v : vulns) {
                    if (textY < margin + rowHeight) {
                        // Stop before overflow – lightweight PDF (pas de multi-page pour simplicité)
                        break;
                    }
                    textX = margin + 2;
                    for (String col : columns) {
                        content.beginText();
                        content.newLineAtOffset(textX, textY);
                        content.showText(shorten(columnExtractors.getOrDefault(col, vv -> "").apply(v), 35));
                        content.endText();
                        textX += tableWidth / columns.size();
                    }
                    textY -= rowHeight;
                }
            }

            document.save(out);
            auditLogService.logExport(metadata.requestedBy(), "PDF", metadata.fileName("pdf"), vulns.size());
            return new ByteArrayResource(Objects.requireNonNull(out.toByteArray()));
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private List<String> resolveColumns(List<String> requested) {
        if (requested == null || requested.isEmpty()) {
            return DEFAULT_COLUMNS;
        }
        return requested.stream()
                .filter(columnExtractors::containsKey)
                .toList();
    }

    private ReportMetadata buildMetadata(VulnerabilityExportRequest request, int recordCount) {
        String user = authenticationService.getCurrentUsername();
        return new ReportMetadata(
                UUID.randomUUID().toString(),
                LocalDateTime.now(),
                user != null ? user : "system",
                request.getScopeDescription() != null ? request.getScopeDescription() :
                        (request.getAssetName() != null ? request.getAssetName() : "Périmètre inconnu"),
                resolveCveDbVersion(),
                recordCount,
                request.getAssetName() != null ? request.getAssetName() : "export"
        );
    }

    private String resolveCveDbVersion() {
        String env = System.getenv("CVE_DB_VERSION");
        if (env != null && !env.isBlank()) return env;
        return System.getProperty("cve.db.version", "N/A");
    }

    private List<VulnerabilityResult> applyFilters(List<VulnerabilityResult> source, Map<String, Object> filters) {
        if (filters == null || filters.isEmpty()) {
            return source;
        }

        return source.stream()
                .filter(v -> matchesFilters(v, filters))
                .toList();
    }

    private boolean matchesFilters(VulnerabilityResult v, Map<String, Object> filters) {
        for (Map.Entry<String, Object> entry : filters.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value == null) continue;

            switch (key) {
                case "score" -> {
                    Map<?, ?> range = (value instanceof Map<?, ?>) ? (Map<?, ?>) value : null;
                    if (range != null) {
                        Double min = toDouble(range.get("min"));
                        Double max = toDouble(range.get("max"));
                        double score = v.getModifiedScore() != null
                                ? v.getModifiedScore().doubleValue()
                                : v.getBaseScore() != null ? v.getBaseScore().doubleValue() : 0d;
                        if (min != null && score < min) return false;
                        if (max != null && score > max) return false;
                    }
                }
                case "rssiStatus" -> {
                    if (!"all".equalsIgnoreCase(value.toString()) &&
                            !value.toString().equalsIgnoreCase(safe(v.getRssiStatus()))) {
                        return false;
                    }
                }
                case "metierStatus" -> {
                    if (!"all".equalsIgnoreCase(value.toString()) &&
                            !value.toString().equalsIgnoreCase(safe(v.getMetierStatus()))) {
                        return false;
                    }
                }
                case "used" -> {
                    if (!"all".equalsIgnoreCase(value.toString()) &&
                            !value.toString().equalsIgnoreCase(safe(v.getValidityStatus()))) {
                        return false;
                    }
                }
                case "comment" -> {
                    String val = value.toString();
                    boolean hasComment = v.getCommentsAnalyst() != null && !v.getCommentsAnalyst().isBlank();
                    if ("with".equalsIgnoreCase(val) && !hasComment) return false;
                    if ("without".equalsIgnoreCase(val) && hasComment) return false;
                }
                case "cve" -> {
                    if (!safe(v.getCveId()).toLowerCase(Locale.ROOT)
                            .contains(value.toString().toLowerCase(Locale.ROOT))) {
                        return false;
                    }
                }
                case "technology" -> {
                    if (!safe(v.getPackageName()).toLowerCase(Locale.ROOT)
                            .contains(value.toString().toLowerCase(Locale.ROOT))) {
                        return false;
                    }
                }
                case "cwe" -> {
                    if (!safe(v.getCwe()).toLowerCase(Locale.ROOT)
                            .contains(value.toString().toLowerCase(Locale.ROOT))) {
                        return false;
                    }
                }
                case "date" -> {
                    Map<?, ?> range = (value instanceof Map<?, ?>) ? (Map<?, ?>) value : null;
                    if (range != null) {
                        LocalDate from = toLocalDate(range.get("from"));
                        LocalDate to = toLocalDate(range.get("to"));
                        LocalDate published = v.getPublishedDate() != null ? v.getPublishedDate().toLocalDate() : null;
                        if (from != null && (published == null || published.isBefore(from))) return false;
                        if (to != null && (published == null || published.isAfter(to))) return false;
                    }
                }
                default -> {
                    // Unknown filter -> ignore
                }
            }
        }
        return true;
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String toStringScore(BigDecimal score) {
        return score != null ? score.toPlainString() : "";
    }

    private Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number num) {
            return num.doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate ld) return ld;
        try {
            return LocalDate.parse(value.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private String formatEpss(BigDecimal epss) {
        return String.format(Locale.FRANCE, "%.2f%%", epss);
    }

    private XWPFDocument loadTemplate(String templateName) throws IOException {
        if (templateName == null || templateName.isBlank()) {
            return new XWPFDocument();
        }

        String templatePath = resolveTemplatePath(templateName);
        File templateFile = new File(templatePath);
        
        if (templateFile.exists()) {
            try (var is = java.nio.file.Files.newInputStream(templateFile.toPath())) {
                return new XWPFDocument(is);
            }
        }

        // Fallback blank document
        return new XWPFDocument();
    }
    
    /**
     * Résout le chemin complet d'un template
     */
    private String resolveTemplatePath(String templateName) {
        // 1) Classpath template
        try {
            Resource resource = new ClassPathResource("templates/" + templateName);
            if (resource.exists()) {
                return resource.getFile().getAbsolutePath();
            }
        } catch (IOException e) {
            // Ignore
        }

        // 2) Uploads directory
        File uploads = new File("uploads/templates/" + templateName);
        if (uploads.exists()) {
            return uploads.getAbsolutePath();
        }
        
        // 3) Assume it's already an absolute path
        return templateName;
    }

    private String shorten(String text, int max) {
        if (text == null) return "";
        if (text.length() <= max) return text;
        return text.substring(0, Math.max(0, max - 3)) + "...";
    }

    public record ExportPayload(Resource resource, String fileName, MediaType mediaType, String format) {
    }

    private record ReportMetadata(String exportId,
                                  LocalDateTime generatedAt,
                                  String requestedBy,
                                  String scope,
                                  String cveDbVersion,
                                  int recordCount,
                                  String assetName) {
        String fileName(String extension) {
            String prefix = assetName != null && !assetName.isBlank() ? assetName : "export";
            return prefix + "_vulnerabilities_" + generatedAt.format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + "." + extension;
        }
    }
}