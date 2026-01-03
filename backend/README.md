# MBDhackuity - Vulnerability Management System

Système de gestion des vulnérabilités basé sur les données CVE du NIST.

## Prérequis

- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- Node.js 18+ (pour le frontend React)

## Installation

### 1. Base de données
```bash
# Créer la base de données
createdb cve_toolbox

# Exécuter les scripts SQL
psql -d cve_toolbox -f schema.sql
psql -d cve_toolbox -f schema_complete.sql
psql -d cve_toolbox -f schema_cvss_comments.sql
```

### 2. Backend Spring Boot
```bash
# Cloner le projet
cd mbdhackuity

# Configurer application.properties
# Modifier le mot de passe PostgreSQL si nécessaire

# Compiler et lancer
mvn clean install
mvn spring-boot:run
```

L'API sera disponible sur `http://localhost:8080`

### 3. Frontend React
```bash
cd frontend
npm install
npm start
```

Le frontend sera disponible sur `http://localhost:3000`

## API Endpoints

### Dashboard
- `GET /api/dashboard/stats` - Statistiques du tableau de bord (KPIs, graphiques)

### CVE
- `GET /api/cves` - Liste des CVE avec filtres
- `GET /api/cves/{cveId}` - Détails d'une CVE
- `GET /api/cves/stats` - Statistiques

### Vulnerabilities
- `GET /api/vulnerabilities` - Liste des vulnérabilités détectées
- `GET /api/vulnerabilities/{id}` - Détails d'une vulnérabilité
- `PUT /api/vulnerabilities/{id}` - Mettre à jour une vulnérabilité

### Actions Correctives
- `GET /api/corrective-actions` - Liste des actions correctives disponibles
- `GET /api/corrective-actions/stats` - Statistiques des mises à jour disponibles

Génère automatiquement des recommandations de mises à jour basées sur :
- Les packages installés détectés dans les scans
- Les CVE associées à chaque version
- L'impact de chaque mise à jour (nombre de CVE corrigées)

### Règles de Conformité
- `GET /api/compliance` - Liste des règles de conformité
- `GET /api/compliance/{id}` - Détails d'une règle
- `POST /api/compliance` - Créer une règle
- `PUT /api/compliance/{id}` - Mettre à jour une règle
- `DELETE /api/compliance/{id}` - Supprimer une règle
- `GET /api/compliance/stats` - Statistiques de conformité

Gère les règles issues des frameworks :
- CIS (Center for Internet Security)
- NIST (National Institute of Standards and Technology)
- ISO 27001
- PCI-DSS (Payment Card Industry Data Security Standard)
- GDPR (General Data Protection Regulation)

### Défauts de Sécurité
- `GET /api/security-defaults` - Liste tous les défauts de sécurité groupés par CVE
- `GET /api/security-defaults/{reference}` - Détails d'un défaut spécifique
- `GET /api/security-defaults/search` - Recherche avec filtres (searchTerm, severity, status)
- `GET /api/security-defaults/stats` - Statistiques des défauts de sécurité

Encyclopédie des défauts de sécurité regroupant automatiquement :
- Les vulnérabilités par CVE-ID unique
- Le nombre d'assets affectés par défaut
- La sévérité calculée à partir du score CVSS
- Le statut (ACTIVE, PATCHED, WONT_FIX)
- Les références CWE associées

### Assets
- `GET /api/assets/scans` - Liste des scans
- `GET /api/assets/{scanName}` - Assets d'un scan

### CVSS
- `PUT /api/cvss/vulnerability/{id}/score` - Modifier le score CVSS
- `POST /api/cvss/vulnerability/{id}/comment` - Ajouter un commentaire/justification

### Import
- `POST /api/scan-import/upload` - Uploader un fichier de scan (Cyberwatch, Nessus, etc.)
- `POST /api/scan-import/{scanName}/match` - Lancer le matching CVE/Assets

### Export
- `GET /api/export/word/{scanName}` - Export Word du rapport
- `GET /api/export/csv/{scanName}` - Export CSV des vulnérabilités

### History
- `GET /api/history` - Historique des justifications et modifications

## Technologies

- **Backend**: Spring Boot 3.2, Java 17, PostgreSQL
- **Frontend**: React, Axios
- **Build**: Maven

## Auteur

Corentin - ESEO / MBDA Systems