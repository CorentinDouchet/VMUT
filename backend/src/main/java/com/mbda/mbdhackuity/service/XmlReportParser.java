package com.mbda.mbdhackuity.service;

import org.springframework.stereotype.Service;
import org.w3c.dom.*;
import javax.xml.parsers.*;
import java.io.*;
import java.util.*;

@Service
public class XmlReportParser {

    public static class XmlCveData {
        private String cveId;
        private String severity;
        private String cvssVector;
        private String description;
        private String affectedPackage;
        private String solution;
        private Double epssScore;
        private Double epssPercentile;
        private List<String> references;
        private String publishDate;

        public XmlCveData() {
            this.references = new ArrayList<>();
        }

        // Getters and Setters
        public String getCveId() { return cveId; }
        public void setCveId(String cveId) { this.cveId = cveId; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getCvssVector() { return cvssVector; }
        public void setCvssVector(String cvssVector) { this.cvssVector = cvssVector; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getAffectedPackage() { return affectedPackage; }
        public void setAffectedPackage(String affectedPackage) { this.affectedPackage = affectedPackage; }

        public String getSolution() { return solution; }
        public void setSolution(String solution) { this.solution = solution; }

        public Double getEpssScore() { return epssScore; }
        public void setEpssScore(Double epssScore) { this.epssScore = epssScore; }

        public Double getEpssPercentile() { return epssPercentile; }
        public void setEpssPercentile(Double epssPercentile) { this.epssPercentile = epssPercentile; }

        public List<String> getReferences() { return references; }
        public void setReferences(List<String> references) { this.references = references; }

        public String getPublishDate() { return publishDate; }
        public void setPublishDate(String publishDate) { this.publishDate = publishDate; }
    }

    public List<XmlCveData> parseXmlReport(File xmlFile) throws Exception {
        Map<String, XmlCveData> cveMap = new HashMap<>();

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(xmlFile);

        // Find all <result> elements
        NodeList results = doc.getElementsByTagName("result");

        for (int i = 0; i < results.getLength(); i++) {
            Element result = (Element) results.item(i);
            
            // Get NVT information
            Element nvt = (Element) result.getElementsByTagName("nvt").item(0);
            if (nvt == null) continue;

            // Extract tags
            String tags = getTextContent(nvt, "tags");
            String cvssVector = extractFromTags(tags, "cvss_base_vector");
            String affectedPackages = extractFromTags(tags, "affected");
            String insight = extractFromTags(tags, "insight");

            // Extract solution
            String solution = getTextContent(nvt, "solution");

            // Get EPSS data
            Element epss = (Element) nvt.getElementsByTagName("epss").item(0);
            Double epssScore = null;
            Double epssPercentile = null;
            
            if (epss != null) {
                Element maxSeverity = (Element) epss.getElementsByTagName("max_severity").item(0);
                if (maxSeverity != null) {
                    String scoreStr = getTextContent(maxSeverity, "score");
                    String percentileStr = getTextContent(maxSeverity, "percentile");
                    
                    try {
                        if (scoreStr != null && !scoreStr.isEmpty()) {
                            epssScore = Double.parseDouble(scoreStr);
                        }
                        if (percentileStr != null && !percentileStr.isEmpty()) {
                            epssPercentile = Double.parseDouble(percentileStr);
                        }
                    } catch (NumberFormatException e) {
                        // Ignore parsing errors
                    }
                }
            }

            // Get CVE references
            Element refs = (Element) nvt.getElementsByTagName("refs").item(0);
            List<String> cveRefs = new ArrayList<>();
            List<String> urlRefs = new ArrayList<>();
            
            if (refs != null) {
                NodeList refList = refs.getElementsByTagName("ref");
                for (int j = 0; j < refList.getLength(); j++) {
                    Element ref = (Element) refList.item(j);
                    String type = ref.getAttribute("type");
                    String id = ref.getAttribute("id");
                    
                    if ("cve".equals(type) && id != null && id.startsWith("CVE-")) {
                        cveRefs.add(id);
                    } else if ("url".equals(type)) {
                        urlRefs.add(id);
                    }
                }
            }

            // Create CVE data for each referenced CVE
            for (String cveId : cveRefs) {
                if (!cveMap.containsKey(cveId)) {
                    XmlCveData cveData = new XmlCveData();
                    cveData.setCveId(cveId);
                    cveData.setCvssVector(cvssVector);
                    cveData.setDescription(insight);
                    cveData.setAffectedPackage(affectedPackages);
                    cveData.setSolution(solution);
                    cveData.setEpssScore(epssScore);
                    cveData.setEpssPercentile(epssPercentile);
                    cveData.setReferences(urlRefs);

                    // Extract severity from EPSS if available
                    if (epss != null) {
                        Element maxSeverity = (Element) epss.getElementsByTagName("max_severity").item(0);
                        if (maxSeverity != null) {
                            NodeList cveElements = maxSeverity.getElementsByTagName("cve");
                            for (int k = 0; k < cveElements.getLength(); k++) {
                                Element cveElement = (Element) cveElements.item(k);
                                if (cveId.equals(cveElement.getAttribute("id"))) {
                                    String severity = getTextContent(cveElement, "severity");
                                    cveData.setSeverity(severity);
                                    break;
                                }
                            }
                        }
                    }

                    cveMap.put(cveId, cveData);
                }
            }
        }

        return new ArrayList<>(cveMap.values());
    }

    private String getTextContent(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        if (nodes.getLength() > 0) {
            Node node = nodes.item(0);
            return node.getTextContent();
        }
        return null;
    }

    private String extractFromTags(String tags, String key) {
        if (tags == null) return null;
        
        String searchKey = key + "=";
        int startIndex = tags.indexOf(searchKey);
        if (startIndex == -1) return null;
        
        startIndex += searchKey.length();
        int endIndex = tags.indexOf("|", startIndex);
        if (endIndex == -1) endIndex = tags.length();
        
        return tags.substring(startIndex, endIndex).trim();
    }
}
