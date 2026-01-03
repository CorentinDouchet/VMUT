
## Installation

### Prérequis

1. **Java JDK 17+**
   ```cmd
   # Télécharger depuis https://adoptium.net/temurin/releases/?version=17
   java -version
   ```

2. **PostgreSQL 12+**
   ```cmd
   # Télécharger depuis https://www.postgresql.org/download/
   psql --version
   ```

3. **Node.js 16+**
   ```cmd
   # Télécharger depuis https://nodejs.org/
   node -version
   npm -version
   ```

4. **Maven 3.6+**
   ```cmd
   mvn -version
   ```

## Technologies

- **Backend**: Spring Boot 3.2.1, Java 17, PostgreSQL 12+, Spring Security + JWT
- **Frontend**: React 19, Vite 7, React Router 7, Axios 1.7, Tailwind CSS 4
- **Build**: Maven 3.6+, npm

### Installation Rapide

```cmd
# 1. Cloner le projet
git clone https://github.com/CorentinDouchet/MBDhackuity.git
cd MBDhackuity

# 2. Configurer PostgreSQL
psql -U postgres
CREATE DATABASE cve_toolbox;
\q

# 3. Créer le schéma (script unique consolidé)
psql -U postgres -d cve_toolbox -f database/setup_complete.sql

# 4. Installer frontend
cd frontend
npm install
cd ..

# 5. Configurer backend
# Modifier backend/src/main/resources/application.properties
# Ajuster les chemins selon votre environnement

# 6. Démarrer l'application
# Terminal 1 - Backend
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Accès Initial

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8080
- **Identifiants par défaut**:
  - Username: `maintenance`
  - Password: `Admin@2025`

⚠️ **CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT !**

---

## ⚙️ Configuration

### Backend (application.properties)

```properties
# Base de données
spring.datasource.url=jdbc:postgresql://localhost:5432/cve_toolbox
spring.datasource.username=postgres
spring.datasource.password=votre_mot_de_passe

# Chemins de fichiers (ABSOLUS)
app.uploads.dir=C:/Users/VOTRE_USER/Documents/mbdhackuity/uploads
app.uploads.scans.dir=C:/Users/VOTRE_USER/Documents/mbdhackuity/uploads/scans
app.uploads.xml.dir=C:/Users/VOTRE_USER/Documents/mbdhackuity/uploads/xml
app.cve.data.dir=C:/Users/VOTRE_USER/Documents/mbdhackuity/backend/src/main/resources/cve_data

# JWT (générer une clé sécurisée en production)
app.jwt.secret=VotreCleSuperSecreteDeMinimum256BitsParSecuriteEtBonnesPratiques
app.jwt.expiration=86400000

# Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

### Frontend (services/api.js)

```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

---

## 🚀 Démarrage

### Script de Setup Unique

Le projet dispose d'un **script SQL consolidé** qui crée automatiquement toute la structure de base de données :

```cmd
psql -U postgres -d cve_toolbox -f database/setup_complete.sql
```

Ce script :
- ✅ Crée toutes les tables (CVEs, Assets, Users, Groupes, etc.)
- ✅ Ajoute les colonnes manquantes si vous migrez depuis une ancienne version
- ✅ Configure les index et contraintes
- ✅ Crée l'utilisateur `maintenance` par défaut
- ✅ Est **idempotent** : peut être exécuté plusieurs fois sans erreur

**Note**: Les anciens scripts (`reset_and_create_schema.sql`, `migrations_after_schema.sql`, etc.) ont été consolidés dans `setup_complete.sql`.

### Import des CVE

```bash
# Via API
curl -X POST http://localhost:8080/api/cves/import

# Ou via interface Admin
# Naviguer vers Admin Import > Importer les CVEs
```

**Temps estimé**: 2-5 minutes pour 114,000 CVE

### Construction de l'index CPE

L'index CPE est construit automatiquement après l'import des CVE via SQL:

```sql
-- Exécuté automatiquement par CveImportService.buildCpeIndex()
-- Crée 455,000+ entrées CPE à partir de cves.cpe_criteria
-- Utilise LATERAL jsonb_array_elements pour parser la structure NVD 2.0
```

---

## Authentification

### Système de Rôles

| Rôle | Permissions |
|------|------------|
| **CONSULTANT** | Lecture seule: voir vulnérabilités, générer rapports |
| **AUTEUR** | Import scans, justifications, ajustement CVSS, changement statuts |
| **ADMINISTRATEUR** | Gestion utilisateurs, gestion groupes d'assets |
| **MAINTENANCE** | Tous les droits (audit, encyclopédie CVE, import) |

### Flux d'Authentification

1. **Login**: POST `/api/auth/login` → JWT token
2. **Stockage**: Token dans localStorage
3. **Requests**: Header `Authorization: Bearer <token>`
4. **Refresh**: Token valide 24h (configurable)

### Création d'Utilisateurs

```javascript
// Via interface Admin (rôle ADMINISTRATEUR ou MAINTENANCE)
POST /api/users
{
  "username": "nouveau_user",
  "email": "user@example.com",
  "password": "Password123!",
  "role": "CONSULTANT",
  "firstName": "Prénom",
  "lastName": "Nom"
}
```

---

## Fonctionnalités

### 1. Gestion des Scans

**Import de scans Cyberwatch (.txt)**
- Format: 871 packages avec nom, version, OS
- Matching automatique avec CPE index
- Détection des vulnérabilités associées

**Import de rapports OpenVAS (.xml)**
- Parse XML avec détails des vulnérabilités
- Extraction CVE-ID depuis les références
- Création automatique d'assets

### 3. Vulnérabilités Consolidées

**Affichage**
- Liste complète avec filtres avancés
- Groupement par scan/asset
- Double statut: traitement + métier

**Statuts de Traitement**
- `A_TRAITER`: Non traité
- `EN_COURS`: En cours de traitement
- `TRAITE`: Traitement terminé

**Statuts Métier**
- `JUSTIFIEE`: Vulnérabilité justifiée (non applicable)
- `ACCEPTEE`: Risque accepté
- `ATTENUEE`: Mesures d'atténuation en place
- `REMEDIEE`: Correctif appliqué

### 4. Justifications et Commentaires

- Commentaires RSSI (analyste)
- Commentaires utilisateur (validateur)
- Historique complet des modifications
- Traçabilité via audit_logs

### 5. Calculateurs CVSS

**CVSS v3.0 et v3.1**
- Interface interactive avec tooltips
- Calcul automatique du score
- Sauvegarde des ajustements

**CVSS v4.0**
- Support complet de la nouvelle version
- Nomenclature mise à jour
- Macro-vecteurs et scoring avancé

### 6. Groupes d'Assets (STB_REQ_0101)

**Cloisonnement fonctionnel**
- Création de groupes (projets, domaines)
- Attribution d'utilisateurs aux groupes
- Filtrage des assets par groupe
- Audit des actions sur les groupes

### 7. Exports

**Formats supportés**
- Word (.docx): Rapport formaté avec tableaux
- Excel (.xlsx): Données brutes + statistiques
- CSV: Export simple pour traitement externe

---

## Architecture

### Structure Backend

```
backend/src/main/java/com/mbda/mbdhackuity/
├── entity/              # Entités JPA (Cve, Asset, User, etc.)
├── repository/          # Repositories Spring Data JPA
├── service/             # Logique métier
│   ├── CveImportService.java       # Import CVE + build CPE index
│   ├── CveMatchingService.java     # Matching scans <-> CVE
│   ├── AuthenticationService.java  # Gestion auth JWT
│   └── ...
├── controller/          # REST controllers
├── security/            # Configuration Spring Security + JWT
│   ├── SecurityConfig.java
│   ├── JwtUtils.java
│   └── JwtAuthenticationFilter.java
└── util/                # Utilitaires (VersionComparator, etc.)
```

### Structure Frontend

```
frontend/src/
├── components/          # Composants React
│   ├── ConsolidatedVulnerabilities_enhanced.jsx  # Vue principale
│   ├── CVEDetail.jsx                             # Détail CVE
│   ├── Assets.jsx                                # Gestion assets
│   ├── AdminImport.jsx                           # Import CVE
│   └── ...
├── services/            # Services API
│   └── api.js           # Axios + interceptors JWT
├── contexts/            # Contexts React
│   └── AuthContext.jsx  # Gestion état authentification
└── App.jsx              # Router principal
```

### Flux de Matching CVE

```
1. Upload scan → ScanUpload.jsx
2. Parse packages → CveMatchingService.parsePackagesFromScan()
3. Save assets → AssetRepository.save()
4. Match CPE → SELECT FROM cpe_index WHERE vendor/product/version
5. Save vulnerabilities → VulnerabilityResultRepository.save()
6. Display → ConsolidatedVulnerabilities_enhanced.jsx
```

---

## Déploiement

### Déploiement Multi-PC

**Configuration requise**:
1. Modifier `application.properties` avec chemins absolus pour le nouvel utilisateur
2. Copier les fichiers NVD JSON dans `cve_data/`
3. Créer la base de données PostgreSQL
4. Exécuter les scripts SQL dans l'ordre
5. Importer les CVE et construire l'index CPE

**Exemple pour un nouvel utilisateur**:

```properties
# Avant
app.uploads.dir=C:/Users/Corentin/Documents/mbdhackuity/uploads

# Après (nouveau PC)
app.uploads.dir=C:/Users/NouvelUtilisateur/Documents/mbdhackuity/uploads
```

### Production - Checklist Sécurité DevOps

#### 🔐 1. Secrets et Credentials

**Actions critiques** :
```bash
# Générer une clé JWT sécurisée (512 bits)
openssl rand -base64 64

# Ne JAMAIS commiter les secrets dans Git
echo "application-prod.properties" >> .gitignore
```

**Configuration sécurisée** :
```properties
# application-prod.properties (NE PAS VERSIONNER)
spring.datasource.password=${DB_PASSWORD}
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration=3600000  # 1h au lieu de 24h

# Utilisateur PostgreSQL dédié (PAS postgres)
spring.datasource.username=vmut_app
```

**Variables d'environnement** :
```bash
export DB_PASSWORD="mot_de_passe_fort_genere"
export JWT_SECRET="cle_jwt_generee_512_bits"
export SPRING_PROFILES_ACTIVE=prod
```

**Mot de passe maintenance** :
```sql
-- Changer immédiatement après le premier déploiement
UPDATE users 
SET password = '$2a$10$NouveauHashBcrypt' 
WHERE username = 'maintenance';
```

---

#### 🗄️ 2. Base de Données PostgreSQL

**Créer un utilisateur applicatif** :
```sql
-- Créer utilisateur avec privilèges limités
CREATE USER vmut_app WITH PASSWORD 'mot_de_passe_fort';
GRANT CONNECT ON DATABASE cve_toolbox TO vmut_app;
GRANT USAGE ON SCHEMA public TO vmut_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO vmut_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO vmut_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO vmut_app;

-- Révoquer accès superuser
REVOKE ALL ON DATABASE cve_toolbox FROM PUBLIC;
```

**Backups automatiques** :
```bash
# Script backup quotidien (/usr/local/bin/backup-vmut.sh)
#!/bin/bash
BACKUP_DIR=/backups/vmut
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U vmut_app -d cve_toolbox -F c -f $BACKUP_DIR/vmut_$DATE.dump
# Garder seulement 30 jours
find $BACKUP_DIR -name "vmut_*.dump" -mtime +30 -delete

# Crontab
0 2 * * * /usr/local/bin/backup-vmut.sh
```

**Chiffrement connexion** :
```properties
# application-prod.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cve_toolbox?ssl=true&sslmode=require
```

**Durcissement PostgreSQL** :
```conf
# postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
password_encryption = scram-sha-256

# pg_hba.conf - Autoriser uniquement localhost
host    cve_toolbox    vmut_app    127.0.0.1/32    scram-sha-256
```

---

#### 🌐 3. HTTPS et Reverse Proxy (nginx)

**Installation nginx** :
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

**Configuration nginx** :
```nginx
# /etc/nginx/sites-available/vmut
server {
    listen 80;
    server_name vmut.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vmut.votre-domaine.com;

    # Certificats SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/vmut.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vmut.votre-domaine.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Frontend (React)
    location / {
        root /var/www/vmut/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Taille max upload (scans)
        client_max_body_size 50M;
    }

    # Bloquer accès direct aux actuators Spring Boot
    location /actuator {
        deny all;
        return 404;
    }
}
```

**Activer et obtenir certificat SSL** :
```bash
sudo ln -s /etc/nginx/sites-available/vmut /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d vmut.votre-domaine.com
```

---

#### 🔥 4. Firewall et Sécurité Réseau

**Configuration UFW (Ubuntu)** :
```bash
# Bloquer tout par défaut
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Autoriser SSH (changer le port par défaut 22 -> 2222)
sudo ufw allow 2222/tcp

# Autoriser HTTPS uniquement
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp  # Redirection vers HTTPS

# Bloquer accès direct aux services internes
sudo ufw deny 8080/tcp  # Backend Spring Boot
sudo ufw deny 5432/tcp  # PostgreSQL

# Activer
sudo ufw enable
sudo ufw status
```

**Fail2ban pour protection brute-force** :
```bash
sudo apt install fail2ban

# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

---

#### 🛡️ 5. Spring Boot - Durcissement Backend

**application-prod.properties** :
```properties
# Désactiver endpoints sensibles
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=when-authorized
management.endpoint.info.enabled=true

# Sécurité uploads
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB

# Logging sécurisé
logging.level.org.springframework.security=INFO
logging.file.name=/var/log/vmut/application.log
logging.file.max-size=10MB
logging.file.max-history=30

# Désactiver stack traces en production
server.error.include-message=never
server.error.include-binding-errors=never
server.error.include-stacktrace=never
server.error.include-exception=false

# Session sécurisée
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.same-site=strict
```

**Validation uploads côté backend** :
```java
// Ajouter dans FileUploadController
@PostMapping("/upload")
public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
    // Validation extension
    String filename = file.getOriginalFilename();
    if (!filename.matches(".*\\.(xml|csv|txt|json|xlsx)$")) {
        return ResponseEntity.badRequest().body("Type de fichier non autorisé");
    }
    
    // Validation taille
    if (file.getSize() > 50_000_000) { // 50MB
        return ResponseEntity.badRequest().body("Fichier trop volumineux");
    }
    
    // Validation contenu (magic bytes)
    byte[] fileBytes = file.getBytes();
    String mimeType = URLConnection.guessContentTypeFromStream(
        new ByteArrayInputStream(fileBytes)
    );
    
    // Scanner antivirus si possible (ClamAV)
    // ...
}
```

**Rate limiting Spring Security** :
```java
// SecurityConfig.java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/login").permitAll()
            .anyRequest().authenticated()
        )
        .sessionManagement(session -> session
            .maximumSessions(3) // Max 3 sessions par user
            .maxSessionsPreventsLogin(true)
        );
    return http.build();
}
```

---

#### 📝 6. Logs et Monitoring

**Logs centralisés** :
```bash
# Installer journalisation système
sudo apt install rsyslog

# Rotation logs
# /etc/logrotate.d/vmut
/var/log/vmut/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 640 root adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
```

**Monitoring avec Prometheus + Grafana** :
```properties
# application-prod.properties
management.endpoints.web.exposure.include=health,metrics,prometheus
management.metrics.export.prometheus.enabled=true
```

**Alertes critiques** :
- Échec authentification répétés
- Tentatives d'upload fichiers suspects
- Erreurs base de données
- CPU/RAM > 80%
- Disque > 90%

---

#### 🔍 7. Audit de Sécurité

**Scan vulnérabilités dépendances** :
```bash
# Backend (Maven)
cd backend
mvn org.owasp:dependency-check-maven:check

# Frontend (npm)
cd frontend
npm audit
npm audit fix
```

**Tests de pénétration automatisés** :
```bash
# OWASP ZAP
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable \
    zap-baseline.py -t https://vmut.votre-domaine.com -r report.html

# Scan ports
nmap -sV -sC vmut.votre-domaine.com
```

**Headers sécurité (vérification)** :
```bash
curl -I https://vmut.votre-domaine.com | grep -E "Strict-Transport|X-Frame|X-Content|CSP"
```

---

#### 🚀 8. Déploiement avec Systemd

**Service Backend** :
```ini
# /etc/systemd/system/vmut-backend.service
[Unit]
Description=VMUT Backend Spring Boot
After=network.target postgresql.service

[Service]
Type=simple
User=vmut
WorkingDirectory=/opt/vmut/backend
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="DB_PASSWORD=mot_de_passe_securise"
Environment="JWT_SECRET=cle_jwt_512_bits"
ExecStart=/usr/bin/java -jar -Xmx2G /opt/vmut/backend/target/vmut-1.0.0.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Service Frontend (build static)** :
```bash
# Build production
cd frontend
npm run build

# Copier dans nginx
sudo cp -r dist/* /var/www/vmut/frontend/dist/
sudo chown -R www-data:www-data /var/www/vmut
```

**Activer services** :
```bash
sudo systemctl daemon-reload
sudo systemctl enable vmut-backend
sudo systemctl start vmut-backend
sudo systemctl status vmut-backend
```

---

#### 📋 9. Checklist Finale Pré-Production

- [ ] ✅ JWT secret généré (512 bits) et stocké en variable d'env
- [ ] ✅ Mot de passe BDD changé, user `vmut_app` créé (pas `postgres`)
- [ ] ✅ Mot de passe utilisateur `maintenance` changé
- [ ] ✅ HTTPS activé avec certificat valide (Let's Encrypt)
- [ ] ✅ Firewall configuré (UFW), ports 8080/5432 fermés
- [ ] ✅ Reverse proxy nginx avec headers sécurité
- [ ] ✅ Rate limiting activé (10 req/s)
- [ ] ✅ Backups PostgreSQL automatiques (quotidiens)
- [ ] ✅ Logs rotation configurée (30 jours)
- [ ] ✅ Spring Boot actuators désactivés/protégés
- [ ] ✅ Validation stricte uploads (extension, taille, contenu)
- [ ] ✅ Session cookies: secure, httpOnly, sameSite
- [ ] ✅ Scan vulnérabilités dépendances (Maven/npm audit)
- [ ] ✅ Monitoring actif (Grafana/Prometheus)
- [ ] ✅ Tests de pénétration effectués (OWASP ZAP)
- [ ] ✅ Documentation mise à jour avec procédures incident
- [ ] ✅ Plan de reprise d'activité (PRA) documenté

---

#### 🔄 10. Maintenance Continue

**Mises à jour sécurité** :
```bash
# Système
sudo apt update && sudo apt upgrade -y

# Dépendances Java
cd backend && mvn versions:display-dependency-updates

# Dépendances Node
cd frontend && npm outdated
```

**Rotation secrets** :
- JWT secret : tous les 6 mois
- Mots de passe : tous les 3 mois
- Certificats SSL : renouvellement automatique Let's Encrypt (90j)

**Audits réguliers** :
- Mensuel : Review logs erreurs/tentatives intrusion
- Trimestriel : Scan vulnérabilités complet
- Annuel : Audit externe sécurité

---

## Maintenance

### Sauvegarde de la Base de Données

```cmd
# Backup complet
pg_dump -U postgres -d cve_toolbox -F c -f backup_cve_toolbox.dump

# Restore
pg_restore -U postgres -d cve_toolbox backup_cve_toolbox.dump
```

### Mise à Jour des CVE

```bash
# 1. Télécharger les nouveaux fichiers NVD JSON
# https://nvd.nist.gov/feeds/json/cve/2.0/

# 2. Placer dans backend/src/main/resources/cve_data/

# 3. Déclencher l'import
curl -X POST http://localhost:8080/api/cves/import

# L'index CPE sera automatiquement reconstruit
```

### Nettoyage de la Base

```sql
-- Supprimer les scans obsolètes
DELETE FROM assets WHERE scan_date < NOW() - INTERVAL '6 months';

-- Nettoyer les logs d'audit anciens
DELETE FROM audit_logs WHERE action_timestamp < NOW() - INTERVAL '1 year';

-- Vacuum pour récupérer l'espace
VACUUM FULL;
```

### Vérification de l'Index CPE

```sql
-- Nombre d'entrées CPE
SELECT COUNT(*) FROM cpe_index;
-- Attendu: 455,000+

-- Nombre de CVE avec CPE
SELECT COUNT(DISTINCT cve_id) FROM cpe_index;
-- Attendu: ~60,000-70,000

-- CVE sans CPE (attendu: environ 40%)
SELECT COUNT(*) FROM cves WHERE cpe_criteria IS NULL OR cpe_criteria = '[]';
```

---

## Dépannage

### Backend ne démarre pas

```cmd
# Vérifier Java
java -version

# Vérifier PostgreSQL
psql -U postgres -d cve_toolbox -c "SELECT version();"

# Logs détaillés
cd backend
mvn spring-boot:run -X
```

### Frontend erreur 500 lors des requêtes

- Vérifier que le backend tourne sur port 8080
- Vérifier le token JWT dans localStorage
- Regarder la console navigateur (F12) pour les détails

### Erreur "failed to lazily initialize a collection"

**Solution**: Vérifier que `@JsonIgnore` est présent sur les collections lazy-loaded (ex: `AssetGroup.users`)

### Erreur "column cpe_criteria is of type jsonb but expression is of type character varying"

**Solution**: La colonne `cpes.cpe_criteria` doit être de type JSONB:

```sql
ALTER TABLE cves ALTER COLUMN cpe_criteria TYPE jsonb USING cpe_criteria::jsonb;
```

### Page blanche lors de l'affichage des CPE

**Solution**: Vérifier que `CVEDetail.jsx` parse correctement la structure NVD 2.0:

```javascript
// doit supporter à la fois:
// Simple: ["cpe:2.3:..."]
// NVD 2.0: [{nodes: [{cpeMatch: [{criteria: "cpe:2.3:..."}]}]}]
```

---

## Spécifications
1.            Spécifications
5.1 Création et gestion des assets

Objectif :

Structurer les assets et les utilisateur au sein de groupes projet pour gérer les accès, la traçabilité, les héritages de justification, et la visualisation ciblée.

STB_REQ_0100: Définition et gestion des rôles utilisateurs

L’outil doit permettre la création, la configuration et l’attribution de rôles utilisateurs distincts, chacun associé à un périmètre de droits fonctionnels strictement défini.

Les rôles suivants doivent être supportés :

 

·     Consultant : accès en lecture seule aux vulnérabilités, justifications et rapports.

·     Auteur : peut importer des fichiers de scan, consulter les vulnérabilités, ajouter des justifications, ajuster un score CVSS, et générer des rapports.

·     Administrateur d’assets : gère les groupes d’assets, les rattachements utilisateurs et supervise les périmètres fonctionnels, sans intervenir sur les vulnérabilités.

·     Maintenance technique : peut mettre à jour les bases CVE/CPE, administrer l’outil, paramétrer l’application. Aucun accès métier (vulnérabilités, justifications, rapports).

 

Action
		

Consultant
		

Auteur
		

Administrateur
		

Maintenance
	

Visualisation des vulnérabilités
		

OK
		

OK
		

OK
		

KO
	

Justification des vulnérabilités
		

KO
		

OK
		

KO
		

KO
	

Révision du score de criticité
		

KO
		

OK
		

KO
		

KO
	

Génération de rapports
		

OK
		

OK
		

OK
		

KO
	

Import de fichier de scan
		

KO
		

 

OK
		

KO
		

KO
	

Gestion des utilisateurs & groupes
		

KO
		

KO
		

OK
		

KO
	

Mise à jour de la base CVE
		

KO
		

KO
		

OK
		

OK
	

Configuration technique
		

KO
		

KO
		

KO
		

OK
	

·     Chaque rôle doit limiter les actions visibles dans l’IHM selon le tableau des droits fonctionnels.

·     La gestion des rôles doit être accessible uniquement aux administrateurs (Admin).

·     Toute modification de rôle doit être journalisée (utilisateur, date, action, cible).

·     Les rôles doivent être appliqués avant chargement des périmètres, garantissant le cloisonnement fonctionnel immédiat.

END_REQ

STB_REQ_0100: Création et gestion des groupes d’assets

L’outil doit permettre la création structurée de groupes d’assets par le rôle Administrateur d’assets.

 

Chaque groupe doit être rattaché a un conteneur PLM (projet, domaine métier ou périmètre)

 

    L’administrateur doit pouvoir : 

    créer, renommer et supprimer un groupe ;
    rattacher un ou plusieurs utilisateurs au groupe (Consultant,Auteur) ;
    rattacher un ou plusieurs assets au groupe ;
    modifier les droits associés aux utilisateurs de groupe (selon leur rôle global)

 

Contrainte :

    Le rattachement ou le changement de groupe doit être journalisé systématiquement.
    Les accès aux données (consultation, justification, ajustement CVSS, export) doit être limités uniquement aux groupes auxquels l’utilisateur est affecté.

 

    Aucun utilisateur ne doit pouvoir voir, importer ou modifier les données d’un groupe auquel il n’est pas rattaché.
    END_REQ

STB_REQ_0100: Création et des gestion des assets et utilisateurs

L’outil Doit permettre à un utilisateur habilité de créer, modifier et supprimer un asset.

 

Chaque asset Doit être nommé selon le format suivante (à partir de son nom et de sa version tel que :

    Nom-machine_Version

 

Chaque asset Doit contenir au minimum les attributs suivants :

    Numéro de série (SN) et/ou Part number (PLM) ;
    Description asset ;

 

Modes de création d’un asset

Trois modalités de création doivent être proposées :

 

Création manuelle simplifiée

    Via un formulaire dans l’interface utilisateur ;
    Champs requis : nom, environnement, OS, UUID (si disponible) ;
    Possibilité d’ajouter ultérieurement des données techniques (scan ou fichier pivot).

 

Création automatique depuis un résultat de scan

    Lors de l’import d’un fichier (OpenVAS, Cyberwatch, script interne), si l’asset n’existe pas :
    Création automatique sur la base des métadonnées ;
    Rattachement du fichier au nouvel asset.

 

Création à partir d’un fichier pivot

    L’utilisateur importe un fichier structuré (format pivot) décrivant l’asset ;
    Si le nom ou l’UUID n’existe pas :
        Création de l’asset ;
        Enrichissement avec les données techniques (paquets, CPE, version…).

 

Rattachement à un groupe fonctionnel

    Chaque asset Doit être obligatoirement rattaché au groupe auquel l’utilisateur est lui-même rattaché (périmètre projet, domaine, etc.).
    Si aucun groupe n’est défini à la création ou à l’import :
        L’asset est automatiquement rattaché à un groupe par défaut nommé “Sans groupe” ou “Non classé” ;
        Ce groupe est visible dans l’interface et soumis aux règles de droits d’accès classiques.

 

Journalisation des actions

Chaque action de création, modification ou suppression d’un asset Doit être tracée. Le journal Doit contenir :

    L’identifiant de l’utilisateur ;
    La date et l’heure ;
    Le mode de création (manuel, import scan, pivot) ;
    Le groupe associé.

END_REQ

STB_REQ_0110: Vue centralisée des Assets

L’outil Doit fournir une vue d’ensemble filtrable des assets existants.

Cette vue Doit permettre un tri par :

    Nom,
    Périmètre / groupe,
    Dernier import,
    Nombre de vulnérabilités associées.

Elle Doit être exportable au format .csv.

END_REQ

STB_REQ_0120: Gestion des groupes d’assets

L’outil Doit permettre de structurer les assets en groupes logiques (ex. par programme, par périmètre, par projet).

Chaque groupe Doit permettre :

•           L’association libre d’assets,

•           L’attribution de droits utilisateurs (auteur / lecteur / admin),

•           La segmentation fonctionnelle (accès restreint par groupe),

•           La visualisation indépendante des statistiques de vulnérabilités.

END_REQ

STB_REQ_0130: Gestion des sous-assets

L’outil Doit permettre la gestion hiérarchique des assets complexes composés de plusieurs sous-ensembles techniques, appelés sous-assets.

 

Chaque sous-asset représente un composant indépendant de l’asset principal (matériel ou logiciel), pouvant faire l’objet d’une analyse ou d’une justification propre.

 

Exigences fonctionnelles :

    Un asset principal peut contenir un ou plusieurs sous-assets ;
    Les sous-assets peuvent être :
        Des composants logiciels (ex. pile logicielle, module applicatif, driver) ;
        Des équipements matériels (ex. alimentation, carte électronique, capteur, interface réseau) ;

 

    L’IHM Doit permettre de :
        Visualiser la structure arborescente de l’asset principal avec ses sous-assets ;
        Identifier les sous-assets liés à un même asset ;
        Associer des vulnérabilités ou fichiers de scan spécifiques à un sous-asset.

 

Contraintes :

    Les sous-assets doivent hériter des métadonnées de l’asset principal (ex : groupe, environnement), sauf indication contraire à l’import ;
    Un fichier de scan ou un fichier pivot peut être rattaché directement à un sous-asset, si identifié comme tel.

 

Chaque composant est modélisé comme un sous-asset pour permettre un suivi individuel des vulnérabilités.

END_REQ

 

 

STB_REQ_0140: Historique des versions d’un asset

L’outil Doit permettre de gérer plusieurs versions successives d’un même asset (ex : OS C2 ITR 1.5.3 → 1.5.4).

Deux modes de duplication doivent être proposés :

    Duplication à l’identique de la structure de l’asset,
    Duplication avec reprise partielle des justifications (si CVE commune).

Chaque version Doit être horodatée, avec trace du lien de parenté.

END_REQ

STB_REQ_0150: Réutilisation de justification entre versions

L’outil devrait permettre à un utilisateur de réutiliser une justification existante lorsqu’une vulnérabilité est détectée à nouveau :

    soit sur une nouvelle version d’un asset déjà analysé (cycle de vie) ;
    soit sur un autre asset similaire (ex. clone, dérivé, copie de référence).

La reprise de justification Doit inclure automatiquement :

    Le commentaire initial saisi par l’utilisateur ;
    Le score CVSS local éventuellement ajusté ;
    Le statut métier associé (Justifiée, Acceptée, Atténuée, Remédiée, etc.).

Conditions de réutilisation :

    L’utilisateur Doit avoir accès à la donnée d’origine (justification initiale), dans le même groupe d’assets ou un groupe auquel il est rattaché ;
    La fonctionnalité est proposée dans l’interface, sur action explicite (pas automatique) ;
    L’utilisateur peut valider, modifier ou refuser la reprise.

END_REQ

1.1.             
1.2.            Import de données (scans, CMDB)

Objectif :

Permettre l’intégration locale et manuelle des données techniques décrivant un asset ou issues d’un audit de vulnérabilités, en s'appuyant sur des fichiers exportés depuis des outils tiers.

STB_REQ_0010: Interface d’importation manuelle

L’outil doit fournir une interface web locale permettant l’import manuel de fichiers.

Cette interface doit permettre :

    L’import unitaire ou par lot (multi-fichiers),
    Le rattachement à un asset existant ou la création automatique d’un nouvel asset,
    Une navigation hors ligne internet, sans requête sortante

END_REQ

STB_REQ_0020: Format de fichiers supportés

L’outil doit supporter les formats de fichiers suivants pour l’importation des données :

    Scans de vulnérabilités :
        OpenVAS / Greenbone : .xml, .csv
        Cyberwatch : .json .txt
        Scripts internes Linux/Windows : .json, .csv

    Fichiers pivot : .csv, .xlsx

Les spécifications techniques doivent inclure un modèle de champ attendu pour chaque format.

L’outil doit être capable de s’adapter aux formats nativement exportés par les outils listés.

Note :

Les spécifications techniques doivent inclure :

    La structure attendue des champs pour chaque format ;
    Le mode de rattachement automatique des données à un asset ;
    Le contrôle de format à l’import (champs obligatoires, erreurs critiques).

Note :

Des fichiers d’exemple sont fournis dans le DOC1 REF_0020 (voir annexes). Ils servent de base contractuelle pour la validation technique, les tests d’import, et la conformité des données.
END_REQ

 

STB_REQ_0030: Contrôle de validité des fichiers

Chaque import doit être soumis à un contrôle strict :

    Structure et encodage du fichier,
    Présence des champs obligatoires : nom machine, OS, version, date, etc.
    Format reconnu (erreur si extension inconnue ou structure corrompue)

En cas d’erreur, le fichier Doit être rejeté avec un message d’erreur explicite.

Une aide au formatage devrait être disponible dans l’interface.

REF_0030

END_REQ

STB_REQ_0040: Support du fichier pivot (inventaire)

L’outil doit permettre l’import de fichiers pivots décrivant techniquement un asset. On y trouve des informations telles que :

    Les composants logiciels et matériels (packages, librairies, services, pilotes, etc.) ;
    Les métadonnées système : nom complet, UUID, OS, environnement, version, etc. ;
    Les identifiants CPE connus, ou à défaut les descriptions techniques des technologies ;
    Les vulnérabilités détectées par des fournisseurs ou bulletins privés (sans CVE publique si applicable) ;
    Les vecteurs CVSS ou informations de scoring fournies ;
    Les références vers des bulletins, notes, rapports ou sources de sécurité.

 

Exigences fonctionnelles :

    Le format pivot Doit être structuré et documenté, conforme à un modèle fourni dans REF_0040 ;
    L’outil Doit vérifier la validité du fichier à l’import (structure, encodage, champs requis) ;
    Le fichier peut être fourni aux formats .csv ou .xlsx ;
    Lors de l’import :
        Un asset est créé ou mis à jour si une correspondance (UUID ou nom) est trouvée ;
        L’action Doit être journalisée (auteur, date, groupe ciblé, succès/échec) ;
        Le fichier Doit être associé à un groupe d’asset ; à défaut, rattachement automatique à un groupe « Non classé ».
         

Nomination des fichiers :
L’outil Doit recommander une convention de nommage standardisée pour les fichiers pivots et les fichiers de scan (voir REF_0040).

END_REQ

STB_REQ_0041: Support des résultats de scan de vulnérabilités

L’outil Doit permettre l’import de résultats de scan issus d’outils tiers, permettant de constituer ou enrichir la description technique d’un asset. Les fichiers de scan sont considérés comme une source d’inventaire brute, contenant les éléments suivants :

    Liste des composants logiciels détectés (paquets, services, bibliothèques, binaires),
    Métadonnées système : nom de machine, UUID, OS, version, date de scan,
    Vulnérabilités identifiées directement (si fournies par l’outil),
    Identifiants CPE détectés ou implicites.

Le traitement des fichiers de scan Doit respecter les règles suivantes :

    Le format Doit être reconnu automatiquement parmi ceux pris en charge : .json, .csv, .xml ;
    Un mappage automatique des champs Doit être proposé (nom, version, type de composant, CPE si présent) ;
    L’utilisateur peut rattacher manuellement le fichier à un asset existant ou déclencher la création automatique d’un nouvel asset si inconnu ;
    Chaque import Doit être journalisé, avec :
        Identifiant de l’utilisateur,
        Date/heure d’import,
        Outil d’origine,
        Asset associé.

Nommage des fichiers de scan :
Format recommandé : projet_<nom-machine_version>_<date>_<scanner>.<extension>
Exemple : projet_OS-C2-1.5.1_2024-10-01_openvas.xml
END_REQ

STB_REQ_0050: Journalisation des imports

L’outil doit générer automatiquement une trace complète à chaque tentative d’import de fichier, qu’il s’agisse de :

 

    Résultats de scan (OpenVAS, Cyberwatch, scripts internes),
    Fichiers pivots,
    Mises à jour des bases CVE/CPE.

 

Les métadonnées suivantes doivent obligatoirement être enregistrées dans le journal :

    Identifiant de l’utilisateur ayant réalisé l’action,
    Date et heure de l’opération,
    Type de fichier importé (Scan, Pivot, Base CVE, etc.),
    Résultat de l’opération (Succès ou Échec),
    Nom de l’asset ou groupe d’assets visé par l’import (si applicable),
    Message d’erreur explicite en cas d’échec (ex : format non reconnu, champ obligatoire manquant, encodage incorrect, etc.).

 

Une section dédiée à l’historique des imports Doit permettre :

    La consultation filtrable par date, utilisateur, type de fichier, groupe,
    L’export complet de l’historique en .xlsx pour archivage ou audit.

 

Les erreurs d’import doivent être affichées immédiatement à l’utilisateur dans l’interface avec un message clair, et enregistrées dans le journal même en cas d’échec.

END_REQ

 
1.3.            Centralisation & fusion des imports

Objectif :

Permettre de consolider plusieurs sources de données (scanners différents, scans successifs) tout en maintenant la traçabilité complète des imports pour un même asset.

STB_REQ_0060: Support multi-source d’imports

L’outil Doit accepter l’import de résultats de scans provenant de plusieurs sources, notamment :

    OpenVAS / Greenbone (XML, CSV),
    Cyberwatch (JSON, TEXT, TXT),
    Scripts internes (Linux, Windows),

 

L’outil Doit être modulaire pour ajouter d’autres sources d’import

Chaque source Doit être identifiée et associée à un parseur dédié.

END_REQ

STB_REQ_0070: Fusion des résultats pour un même asset

L’outil doit permettre de fusionner automatiquement les données de scans portant sur un même asset (identifié par nom machine ou UUID).

La fusion doit :

 

    Éviter la duplication de composants déjà détectés dans une analyse antérieure,
    Ajouter les nouveaux composants identifiés,
    Détecter les doublons de CVE sur un même asset, quelle que soit la source de détection.

 

Gestion des doublons CVE détectés par plusieurs sources :

Lorsque plusieurs outils de scan identifient une même vulnérabilité (même identifiant CVE) sur un même asset, l’outil Doit :

    Afficher une ligne distincte par outil de détection dans l’interface utilisateur,
    Centraliser la justification sur une unique entrée par couple [CVE – Asset],
    Permettre une gestion unifiée du statut et des traitements associés.

 

Export des résultats :

Deux modes de sortie doivent être proposés à l’utilisateur au moment de l’export :

    Mode “Détail technique” : chaque détection est listée individuellement par outil, pour les besoins d’investigation.
    Mode “Consolidé” : les détections multiples sont regroupées par CVE unique, pour les livrables de synthèse.

 

Voir REF_0070 pour des exemples de sortie attendue.

END_REQ

STB_REQ_0080: Journalisation des imports multiples

Chaque import, même fusionné dans un asset existant, Doit être journalisé avec :

    La source du scan (outil utilisé),
    Le format du fichier,
    L’utilisateur,
    La date et l’heure d’import,
    Le périmètre cible (asset ou groupe).

END_REQ

STB_REQ_0090: Visualisation des imports historiques

L’outil Doit offrir une interface de consultation de l’historique des imports par asset ou groupe, permettant de :

    Visualiser chaque import individuellement (date, source, état),
    Filtrer les résultats par période ou utilisateur,
    Revenir sur un import spécifique (référence à une analyse donnée).

END_REQ

 
1.4.            Base CVE/CPE locale & corrélation

Objectif :

Corréler les composants détectés sur les assets avec les vulnérabilités connues, via des bases locales (CVE/CPE/CWE) maintenues manuellement dans un environnement déconnecté.

STB_REQ_0160: Intégration des bases CVE/CPE/CWE

L’outil Doit permettre l’import manuel des bases de vulnérabilités suivantes au format JSON :

    CVE (Common Vulnerabilities and Exposures) depuis https://nvd.nist.gov/vuln/data-feeds
    CPE (Common Platform Enumeration) depuis la NVD.
    CWE (Common Weakness Enumeration) depuis https://cwe.mitre.org/

L’import Doit se faire depuis une source locale (clé USB ou dossier réseau restreint), sans accès internet.

END_REQ

STB_REQ_0170: Journalisation des imports de base

Chaque import de base de vulnérabilités Doit être journalisé avec les éléments suivants :

    Nom du fichier JSON importé,
    Type de base (CVE ou CPE),
    Horodatage (date/heure),
    Identité de l’utilisateur ayant effectué l’action,
    Nombre d’entrées intégrées.

En cas d’erreur, un message explicite Doit être affiché.

END_REQ

STB_REQ_0180: Encapsulation locale des données CVE/CPE

Les données issues des dumps JSON doivent être structurées et stockées localement dans une base de données, permettant :

    La recherche rapide,
    Le filtrage par identifiant (CVE ID, CPE ID),
    L’accès aux métadonnées (description, score CVSS, références externes, publication).

END_REQ

STB_REQ_0190: Encyclopédie CVE / CPE consultable

L’outil Doit proposer deux interfaces de recherche :

    Une encyclopédie CVE,
    Une encyclopédie CPE,
    Une encyclopédie CWE,

Permettant une recherche hors ligne par :

    Identifiant (CVE-XXXX-XXXXX ou CPE),
    Mot-clé,
    Fournisseur ou produit,
    Score CVSS.

Les fiches doivent être exportables au format Excel.

END_REQ

STB_REQ_0200: Corrélation automatique vulnérabilité ↔ composant

L’outil Doit effectuer une corrélation automatique entre :

    Les composants détectés dans les assets (issus de fichiers pivots, scans ou descriptions techniques),
    Et les CPE listés dans les CVE de la base NVD embarquée.
     

La correspondance Doit respecter les règles suivantes :

    Matching strict sur les CPE complets : si les deux identifiants CPE sont identiques caractère par caractère, la correspondance est immédiate.
    Matching avec astérisques génériques : les segments marqués * dans les CPE ne doivent pas empêcher une correspondance si les autres segments concordent.
    Matching sur plages de versions : si une CVE s’applique à un intervalle de versions (ex : >= 2.13.0 et < 2.15.0), la correspondance est valable si le composant détecté est dans cette plage.
    Le système Doit également tenir compte de l’OS, de l’architecture ou du type de produit (application, OS, bibliothèque, matériel...) si ces éléments sont précisés dans le CPE.

 

Voir Référence associée REF_0200 pour des cas pratiques.

END_REQ

STB_REQ_0210: Moteur de mapping CPE manuel

En cas d’absence de correspondance automatique, L’outil devrait proposer une interface de mapping manuel permettant :

    De relier un composant non reconnu à un identifiant CPE ,
    D’enrichir le dictionnaire local,
    De mémoriser l’association pour les futurs imports.

END_REQ

STB_REQ_0220: Corrélation post-import et relance manuelle

L’utilisateur Doit pouvoir relancer manuellement une corrélation sur un ou plusieurs assets :

    Lors de l’ajout d’un composant à un asset existant,
    Après l’import d’une nouvelle base CVE/CPE.

Le statut de la corrélation (date de dernière exécution, nombre de CVE détectées) Doit être visible dans la fiche asset.

END_REQ

STB_REQ_0230: Gestion des sources multiples et déduplication

L’outil Doit gérer la possibilité que plusieurs sources de vulnérabilités soient présentes (ex : base CVE, bulletins Microsoft, bulletins Canonical).

En cas de doublon :

    Les vulnérabilités doivent être fusionnées logiquement,
    Le système Doit conserver l’historique des sources ayant signalé la même CVE,
    Un indicateur de confiance ou origine Doit être affiché.

END_REQ

 

 

 
1.5.            Visualisation & traitement des vulnérabilités

Objectif :

Offrir une interface claire et centralisée permettant de visualiser, filtrer, et analyser les vulnérabilités associées à un ou plusieurs assets, dans le cadre d’un audit formel ou d’une revue de sécurité.

STB_REQ_0240: Tableaux interactifs de visualisation

L’outil Doit fournir une vue tabulaire centralisée permettant d’afficher les vulnérabilités :

    Par asset,
    Par identifiant CVE,
    Par groupe d’assets,
    Par criticité.

Cette vue Doit être interactive et filtrable à l’aide de radio bouton, notamment par :

    Date de détection,
    Périmètre ou groupe,
    Statut de traitement (à traiter, justifiée, acceptée, atténuée, remédiée),
    Score CVSS

END_REQ

STB_REQ_0250: Affichage des métadonnées CVE

Chaque entrée CVE affichée dans la vue Doit comporter :

    L’identifiant CVE (ex. CVE-2023-12345),
    Le nom du composant concerné (via CPE ou nom logiciel),
    La version affectée (si connue),
    Le score CVSS et le vecteur associé,
    La date de publication,
    Un lien hypertexte vers la fiche officielle (NVD ou cve.org).

END_REQ

STB_REQ_0260: Indicateurs visuels de traitement

Chaque vulnérabilité Doit être associée à deux statuts métier distincts et visibles dans l’interface, sous forme de colonnes dédiées :

 

1. Statut de traitement :

    À traiter
    En cours de traitement
    Traité

Ce statut reflète le cycle de gestion, en lien avec l'activité utilisateur.

 

2. Positionnement métier (type de justification ou décision) :

    Justifiée
    Acceptée
    Atténuée
    Remédiée

Ce statut reflète le contenu métier de la décision liée à la vulnérabilité.

    Représentation visuelle :

    Chaque statut Doit être affiché par badge ou code couleur standardisé, directement dans les tableaux (vue par asset, par CVE, etc.) ;
    L’utilisateur Doit pouvoir filtrer et trier les vulnérabilités selon ces deux dimensions.

END_REQ

 

STB_REQ_0261: Indicateur d’obsolescence technologique

L’outil Doit permettre de signaler et tracer explicitement l’obsolescence des technologies identifiées dans les assets.

 

L’outil Doit permettre d’enregistrer l’état d’obsolescence d’un composant ou d’une technologie :

        Saisie manuelle par l’utilisateur (rôle Auteur ou Admin technique) ;
        Ou via import d’un référentiel (à venir, hors périmètre immédiat).

 

    Le champ Obsolescence peut contenir :
        Un statut binaire : Obsolète / Non obsolète ;
        Ou un champ enrichi : Fin de support connue, Date de fin de vie, Remplaçant recommandé, Justification libre.

 

    L’état d’obsolescence Doit être visible dans l’interface :
        Dans la fiche de l’asset ;
        Dans les tableaux de vulnérabilités (colonne ou badge visuel) ;
        Dans les exports de rapports (champ dédié).

 

    Chaque marquage Doit être journalisé :
        Date et heure ;
        Utilisateur ;
        Technologie concernée ;
        Justification (si fournie).
    Si une vulnérabilité concerne un composant déclaré obsolète, l’outil Doit permettre d’afficher une alerte ou d’aider à la justification.

 

Exemples de cas :

    L’OS Windows 7 SP1 est marqué comme obsolète manuellement.
    Une ancienne version de Java 6 est détectée dans un fichier pivot : possibilité d’ajouter une ligne "obsolescence = oui, fin de support = 12/2015".

END_REQ

STB_REQ_0270: Visualisation par blocs (groupes d’assets)

L’outil Doit permettre une visualisation agrégée des vulnérabilités à l’échelle d’un bloc logique, correspondant à un groupe d’assets défini dans l’interface.

Cette vue Doit présenter :

    Le nombre total de CVE détectées dans le groupe ;
    La répartition par statut de traitement (à traiter, justifiée, acceptée, etc.) ;
    La répartition par niveau de criticité (CVSS, score brut ou ajusté) ;
    Un historique d’évolution dans le temps (par date d’import ou de justification).
    Filtres spécifiques requis :

    L’utilisateur Doit pouvoir filtrer les vulnérabilités publiées avant une date de veille définie, afin d’identifier les CVE antérieures à une échéance spécifique (ex : date limite de justification).

END_REQ

STB_REQ_0280: Présentation synthétique et exportable

La vue vulnérabilités Doit inclure :

Une synthèse en en-tête ou en bas de page : nombre total de CVE, taux de traitement, criticité moyenne.

Une option d’export direct vers Excel, CSV ou PDF depuis cette vue, en conservant les filtres actifs.

END_REQ

STB_REQ_0290: Section “À propos” dans l’IHM

L’IHM de L’outil Doit intégrer une section dédiée intitulée “À propos”, accessible à tout utilisateur, visant à documenter les choix structurants et les conventions de l’outil.

 

Contenu minimum attendu de la section “À propos”

 

Cette section Doit présenter de manière synthétique les éléments suivants :

 

Sources officielles utilisées :

        Base CVE : National Vulnerability Database (NVD) – https://nvd.nist.gov
        Référentiel CPE : CPE Dictionary – https://nvd.nist.gov/products/cpe

Version du système de scoring utilisée :

·     CVSS version 3.x (base score par défaut)

Politique d’ajustement des scores :

·     Le score NVD n’est jamais modifié ;

·     Les ajustements sont appliqués localement et contextualisés par asset ;

·     Score CVSS personnalisé basé sur le vecteur environnemental uniquement.

 

Fonctionnalités complémentaires possibles

·     Intégration d’une FAQ (Foire aux questions) ou d’une section “En pratique” :

·     Différence entre score CVSS officiel et ajusté

·     Cas d’usage typiques (audit, justification, fusion, import)

·     Comportement attendu en cas de doublon ou de données manquantes

 

Contraintes de forme

·     Cette section Doit être accessible via l’IHM (pied de page, menu ou onglet spécifique) ;

·     Le contenu Doit être consultable en lecture seule, horodaté, versionné ;

·     Si l’outil est mis à jour, les changements dans cette section doivent être notifiés (ex : "Changelog", date de modification).

END_REQ

 
1.6.            Justification & score local CVSS

Objectif :

Permettre une justification métier formelle de chaque vulnérabilité détectée, avec attribution d’un statut, ajout de preuves, et ajustement contextualisé de la sévérité (score CVSS local).

 

 

STB_REQ_0300: Justification textuelle d’une vulnérabilité

L’outil Doit permettre à un utilisateur habilité (rôle Auteur) d’associer à une vulnérabilité détectée une justification formalisée, composée des éléments suivants :

    Un texte libre décrivant le contexte ou la décision ;
    Un motif prédéfini, sélectionné parmi une liste de raisons métier (ex. : composant non exposé, système hors réseau, vulnérabilité non exploitable, usage restreint...) ;
    Un ou plusieurs documents justificatifs en pièce jointe (formats pris en charge : PDF, TXT, image).

 

Chaque justification Doit obligatoirement être historisée, avec les informations suivantes :

    Identifiant de l’auteur ;
    Date et heure de soumission ;
    Statut métier associé (acceptée, atténuée, etc.) ;
    État antérieur (en cas de modification de justification).

Référence associée : REF_0300
Des exemples de justifications concrètes (texte + capture écran + statut) sont fournis dans le document REF

END_REQ

STB_REQ_0310: Attribution de statut métier

Chaque vulnérabilité Doit pouvoir être associée à l’un des statuts métier suivants :

    À traiter, En cours de traitement, Traité
    Justifiée, Acceptée, Atténuée, Remédiée.

Le changement de statut Doit être journalisé et visible dans l’interface et les exports.

END_REQ

STB_REQ_0320: Score CVSS ajusté localement

L’outil Doit intégrer une calculatrice CVSS embarquée selon la version du CVSS, permettant aux utilisateurs habilités (auteurs) de :

    Appliquer un score ajusté propre à un couple asset–vulnérabilité, sans modifier le score de la CVE dans la base NVD ;
    Recalculer un score CVSS personnalisé, sur la base des vecteurs officiels (AV, AC, PR, UI, etc.) ;
    Associer le score ajusté à une justification contextualisée, libre ou prédéfinie (motif, commentaire, preuve documentaire).

 

Le score CVSS ajusté ne modifie jamais la donnée officielle NVD présente dans la base locale.

 

Données enregistrées pour chaque ajustement :

    Date de l’ajustement ;
    Identifiant de l’auteur ;
    Vecteur CVSS utilisé (base ou environnemental) ;
    Score CVSS NVD d’origine (pour comparaison) ;
    Justification associée (texte + statut métier).

 

Fonctionnalités complémentaires attendues :

    Application en masse d’un vecteur environnemental CVSS sur une sélection de vulnérabilités via :
        Sélection multi-critères,
        Radio-boutons / filtres d’IHM.
    Prévisualisation des scores ajustés avant validation.
    Possibilité de modifier la description enrichie d’une CVE à des fins internes (champ interne non exporté).
    Possibilité de compléter ou corriger la classification CWE si absente ou erronée dans la source.
    Score affiché par défaut = score CVSS officiel NVD ; si celui-ci est absent, l’utilisateur peut compléter manuellement.

 

La calculatrice CVSS Doit donner les descriptions des différents éléments du vecteur tels que définis par le first.

 

Interface utilisateur (IHM) :

    La calculatrice Doit être intégrée à l’IHM,
    Doit afficher la description des métriques CVSS, conforme aux définitions FIRST (https://www.first.org/cvss/),
    Le vecteur et le score doivent être visibles dans l’historique de justification,
    L’utilisateur Doit pouvoir visualiser l’évolution des ajustements (timeline ou log).

 

REF associée : REF_0320 – Exemple et documentation calculatrice CVS

END_REQ

STB_REQ_0330: Historique et traçabilité des ajustements

L’historique complet des actions réalisées sur une vulnérabilité Doit être conservé, incluant :

    Justifications ajoutées ou modifiées,
    Statuts appliqués,
    Ajustements de score CVSS,
    Pièces justificatives.

Ces éléments doivent être consultables par tout utilisateur autorisé et exportables pour vérification/audit.

END_REQ
1.7.            Exports et rapports

Objectif :

Permettre la génération de rapports exploitables à partir des données analysées et justifiées, pour différents publics : RSSI, auditeurs, équipes projets, etc. Les formats doivent être adaptés à un usage documentaire ou technique.

STB_REQ_0340: Formats de rapport supportés

L’outil Doit permettre l’export des rapports relatifs aux vulnérabilités et aux assets, dans les formats suivants :

    DOCX : Rapport modifiable à destination des parties prenantes métiers (RSSI, auditeurs, responsables techniques). Doit permettre un export lisible et structuré, incluant les justifications, scores CVSS, commentaires, statuts, etc.
    PDF : version figée à des fins d’archivage, audit ou traçabilité réglementaire ;
    CSV : Export brut et structuré des résultats techniques (CVE, composants, scores, métadonnées). Utilisable pour du traitement automatisé ou via des outils de type tableur.
    Excel : Format de tableau structuré, destiné à une consultation ou un retraitement manuel par les utilisateurs techniques. Contenu similaire au CSV, avec mise en forme facilitée (tri, filtres, mises en page préformatées).
    Exigences complémentaires :

    L’export Doit pouvoir être déclenché à tout moment, à chaque étape du traitement, y compris :
        Après import des résultats,
        Après corrélation automatique,
        Après ajout ou modification de justification,
        Après ajustement du score CVSS.
    L’utilisateur Doit pouvoir choisir dynamiquement :
        Le périmètre fonctionnel concerné (groupe d’assets, période, statut),
        Les champs inclus (CVE, score, justification, commentaires, statut, asset, etc.),
        Le modèle de rapport (template modifiable s’il est au format DOCX).
    Chaque export Doit comporter automatiquement :
        La date de génération,
        Un identifiant unique,
        Le nom de l’utilisateur à l’origine de l’export.

END_REQ

 

STB_REQ_0350: Contenu personnalisable des rapports

L’outil Doit permettre à l’utilisateur de personnaliser dynamiquement le contenu des rapports générés.

Les paramètres de filtrage doivent inclure :

    La sélection du périmètre fonctionnel :
        Par asset ou groupe d’assets ;
        Par plage de dates (analyse, justification, import) ;
    Le filtrage par critères de sécurité :
        Par criticité (CVSS) ;
        Par statut de traitement (À traiter, Justifiée, Acceptée, etc.) ;
        Par présence ou absence de justification.

 

L’utilisateur Doit également pouvoir choisir les colonnes à inclure dans l’export final parmi les champs disponibles, tels que :

    Identifiant CVE ;
    Nom du composant / technologie concernée ;
    Version du composant ;
    Score CVSS (source NVD) ;
    Score CVSS ajusté (si applicable) ;
    Vecteur CVSS appliqué ;
    Statut métier ;
    Justification ;
    Auteur de la justification ;
    Date de justification ou d’analyse.
     

Les champs sélectionnés doivent être reflétés dans l’aperçu avant export et dans le rapport généré (DOCX, CSV).

END_REQ

STB_REQ_0360: Modèle personnalisables

L’outil Doit permettre la configuration de modèles personnalisés pour l’export de rapports, afin de s’adapter aux formats utilisés par les différentes parties prenantes (ex : rapport d’audit, rapport interne, livrable client).

 

L’outil Doit :

    Accepter l’import de fichiers modèles au format .docx définis par l’organisation ;
    Insérer automatiquement les données dans les sections prévues du modèle (tableaux ou blocs de texte) sans altérer le format du fichier d’origine ;
    Respecter la structure du modèle (en-tête, pied de page, logo, titre, sommaire…) sans chercher à reproduire les fonctionnalités d’un éditeur de texte.

Remarque :
L’outil ne Doit pas permettre l’édition directe du contenu comme le ferait un traitement de texte (Word).

Il Doit uniquement remplir automatiquement les champs désignés du modèle avec les données issues du traitement des vulnérabilités.

 

 

 

 

Exemples de champs à remplir :

    Tableau de synthèse des vulnérabilités ;
    Bloc de justification par CVE ou par asset ;
    Métadonnées du périmètre analysé (groupe, date, auteur).

END_REQ

STB_REQ_0370: Métadonnées automatiques dans les rapports

Chaque rapport généré Doit comporter automatiquement les métadonnées suivantes :

    Date de génération,
    Identifiant unique du rapport,
    Auteur de l’export,
    Version de la base CVE utilisée (si applicable),
    Périmètre exporté.

END_REQ

 

STB_REQ_0380: Compatibilité avec les audits SSI

Le format des rapports Doit garantir :

•           La lisibilité des informations techniques,

•           La traçabilité des décisions,

•           L’identification des auteurs.

END_REQ
1.8.            Historique & traçabilité complète

Objectif :

Garantir une traçabilité totale des actions utilisateurs et des modifications apportées aux données critiques (vulnérabilités, statuts, justifications, imports, exports, etc.).

STB_REQ_0390: Journalisation des actions critiques

L’outil Doit journaliser automatiquement toute action critique réalisée par un utilisateur, incluant au minimum :

    Import de données,
    Ajout ou modification de justification,
    Ajustement de score CVSS,
    Changement de statut d’une vulnérabilité,
    Export de rapports.

Chaque journal Doit contenir : l’identifiant utilisateur, la date et l’heure, le type d’action, la cible concernée (asset, vulnérabilité…).

END_REQ

STB_REQ_0400: Interface de consultation des logs

L’outil Doit proposer une interface permettant de consulter les journaux d’événements par :

    Périmètre (groupe d’assets),
    Action (import, justification, export…),
    Utilisateur,
    Date.

Les logs doivent pouvoir être filtrés, triés, et exportés en CSV pour archivage ou audit externe.

END_REQ

STB_REQ_0410: Versioning des données d’analyse

L’outil Doit assurer un versioning complet des données d’analyse afin de garantir la traçabilité des corrélations, justifications et décisions prises dans le temps.

 

Les exigences suivantes doivent être respectées :

    Chaque corrélation entre des vulnérabilités et un asset Doit être horodatée au moment de son exécution ;
    L’outil Doit enregistrer la version (ou date d'import) des bases CVE,CPE et CWE utilisées lors de cette analyse ;
    Lorsqu’une justification est ajoutée à une vulnérabilité :
        Le score CVSS officiel issu de la NVD à l’instant de la justification Doit être figé dans l’historique ;
        Le vecteur CVSS associé à ce score Doit également être enregistré ;
    En cas d’évolution ultérieure du score CVSS dans la base NVD :
        L’outil Doit afficher un indicateur visuel (ou une alerte) pour signaler à l’utilisateur que la note officielle a changé depuis la justification initiale.

 

But : Permettre à un utilisateur de retracer à tout moment la justification dans son contexte historique (score et vecteur CVSS au moment de la validation), même si les données de référence ont évolué.

END_REQ

STB_REQ_0420: Historique des modifications de justification

L’outil Doit conserver l’historique complet des justifications, avec :

    Texte initial et modifications successives,
    Dates et utilisateurs ayant effectué chaque modification,
    Statut associé (acceptée, atténuée, etc.),
    Score CVSS initial et score CVSS ajusté.

L’historique Doit être consultable dans l’interface dédiée à la vulnérabilité.

END_REQ