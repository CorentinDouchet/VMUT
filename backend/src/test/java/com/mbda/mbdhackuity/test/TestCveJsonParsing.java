package com.mbda.mbdhackuity.test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;

public class TestCveJsonParsing {
    public static void main(String[] args) {
        try {
            File jsonFile = new File("../cve_data/nvdcve-2.0-2016.json");
            System.out.println("📁 Fichier: " + jsonFile.getAbsolutePath());
            System.out.println("📊 Existe: " + jsonFile.exists());
            System.out.println("📏 Taille: " + jsonFile.length() + " bytes");
            
            if (!jsonFile.exists()) {
                System.out.println("❌ Fichier non trouvé!");
                return;
            }
            
            ObjectMapper mapper = new ObjectMapper();
            System.out.println("🔄 Parsing JSON...");
            JsonNode root = mapper.readTree(jsonFile);
            
            JsonNode vulnerabilities = root.get("vulnerabilities");
            if (vulnerabilities == null) {
                System.out.println("❌ Pas de noeud 'vulnerabilities'");
                System.out.println("📋 Clés disponibles: " + root.fieldNames());
                return;
            }
            
            System.out.println("✅ Trouvé " + vulnerabilities.size() + " vulnérabilités");
            
            if (vulnerabilities.size() > 0) {
                JsonNode firstVuln = vulnerabilities.get(0);
                JsonNode cveNode = firstVuln.get("cve");
                if (cveNode != null && cveNode.has("id")) {
                    System.out.println("📌 Première CVE: " + cveNode.get("id").asText());
                }
            }
            
        } catch (Exception e) {
            System.out.println("❌ Erreur: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
