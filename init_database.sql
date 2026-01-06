-- ========================================
-- SCRIPT DE SETUP COMPLET VMUT - VERSION UNIFIÉE ET CORRIGÉE
-- VMUT - Vulnerability Management Unified Tool
-- ========================================
-- Description : Script SQL unique pour la création complète de la base de données
--               Compatible avec bases vierges ET bases existantes
--               Idempotent : peut être exécuté plusieurs fois sans erreur
--               Regroupe : setup_complete.sql + technology_obsolescence.sql +
--                         obsolescence_migration.sql + add_obsolescence_columns.sql +
--                         update_validity_status.sql + setup_fixed.sql
--               CORRIGE automatiquement les types de colonnes INTEGER -> BIGINT
-- 
-- Utilisation : psql -U postgres -d mbdhackuity -f init_database.sql
-- 
-- Ordre d'exécution :
--   0. Configuration et nettoyage
--   1. Connexion à la base
--   2. Tables de base (CVEs, Assets)
--   3. Tables de matching et résultats
--   4. Tables de conformité et actions correctives
--   5. Tables d'authentification et groupes
--   6. Tables d'audit et logs
--   7. Tables CPE et mappings
--   8. Tables d'obsolescence technologique
--   9. Vues et fonctions
--  10. Données initiales
--  11. Permissions
--  12. Correction automatique des types de colonnes
--  13. Vérifications finales
-- 
-- Date : 2026-01-06
-- Dernière modification : 2026-01-06 - Ajout de corrections automatiques
-- ========================================

\c mbdhackuity

-- ========================================
-- PARTIE 0: CONFIGURATION INITIALE
-- ========================================

-- Désactiver temporairement les contraintes pour faciliter le DROP CASCADE
SET session_replication_role = 'replica';

-- ========================================
-- PARTIE 1: TABLES DE BASE - CVEs
-- ========================================

CREATE TABLE cves (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) UNIQUE NOT NULL,
    source_identifier VARCHAR(255),
    published TIMESTAMP,
    last_modified TIMESTAMP,
    vuln_status VARCHAR(50),
    description TEXT,
    base_score DECIMAL(3,1),
    base_severity VARCHAR(20),
    vector_string VARCHAR(255),
    cvss_version VARCHAR(10),
    cpe_criteria TEXT,
    cve_references TEXT,
    raw_data TEXT,
    cwes TEXT,
    assigner VARCHAR(255),
    change_history TEXT
);

-- Index CVEs
CREATE INDEX IF NOT EXISTS idx_cve_id ON cves(cve_id);
CREATE INDEX IF NOT EXISTS idx_base_score ON cves(base_score);
CREATE INDEX IF NOT EXISTS idx_base_severity ON cves(base_severity);
CREATE INDEX IF NOT EXISTS idx_published ON cves(published);
CREATE INDEX IF NOT EXISTS idx_cves_assigner ON cves(assigner);

-- ========================================
-- PARTIE 2: TABLES DE BASE - ASSETS
-- ========================================

CREATE TABLE asset_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    plm_container VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'CYBERWATCH',
    scan_name VARCHAR(255),
    package_name VARCHAR(255),
    package_version VARCHAR(255),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    hostname VARCHAR(255),
    scan_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    raw_data JSONB,
    -- STB_REQ_0102
    serial_number VARCHAR(100),
    part_number VARCHAR(100),
    environment VARCHAR(50),
    uuid VARCHAR(255),
    version VARCHAR(50),
    creation_mode VARCHAR(20) DEFAULT 'MANUAL',
    related_asset_name VARCHAR(255),
    asset_group_id BIGINT,
    -- STB_REQ_0130 (hiérarchie)
    parent_asset_id BIGINT,
    -- STB_REQ_0140 (versioning)
    previous_version_id BIGINT
);

-- Index assets
CREATE INDEX IF NOT EXISTS idx_assets_package ON assets(package_name);
CREATE INDEX IF NOT EXISTS idx_assets_scan ON assets(scan_name);
CREATE INDEX IF NOT EXISTS idx_assets_scan_date ON assets(scan_date);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_part_number ON assets(part_number);
CREATE INDEX IF NOT EXISTS idx_assets_uuid ON assets(uuid);
CREATE INDEX IF NOT EXISTS idx_assets_group_id ON assets(asset_group_id);
CREATE INDEX IF NOT EXISTS idx_assets_scan_package ON assets(scan_name, package_name, package_version);

-- ========================================
-- PARTIE 3: TABLES DE MATCHING ET RÉSULTATS
-- ========================================

CREATE TABLE cve_matches (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50),
    asset_id BIGINT,
    match_confidence DECIMAL(3,2),
    matched_on VARCHAR(50),
    match_date TIMESTAMP DEFAULT NOW(),
    CONSTRAINT cve_matches_cve_id_fkey FOREIGN KEY (cve_id) REFERENCES cves(cve_id) ON DELETE CASCADE,
    CONSTRAINT cve_matches_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_matches_cve ON cve_matches(cve_id);
CREATE INDEX IF NOT EXISTS idx_matches_asset ON cve_matches(asset_id);

CREATE TABLE vulnerability_results (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    asset_id BIGINT,
    scan_name VARCHAR(255),
    package_name VARCHAR(255),
    package_version VARCHAR(255),
    cve_description TEXT,
    cwe VARCHAR(255),
    cvss_version VARCHAR(10),
    base_score DECIMAL(3,1),
    base_severity VARCHAR(20),
    vector_string VARCHAR(255),
    affected_technologies TEXT,
    exploit_poc_available BOOLEAN DEFAULT false,
    exploit_references TEXT,
    published_date TIMESTAMP,
    last_modified_date TIMESTAMP,
    added_to_scan_date TIMESTAMP DEFAULT NOW(),
    exploitation_date TIMESTAMP,
    match_confidence DECIMAL(3,2),
    match_type VARCHAR(50),
    validity_status VARCHAR(50) DEFAULT 'valid',
    cve_references JSONB,
    -- STB_REQ_0260 (double statut)
    treatment_status VARCHAR(50) DEFAULT 'A_TRAITER' CHECK (treatment_status IN ('A_TRAITER', 'EN_COURS', 'TRAITE')),
    business_status VARCHAR(50) CHECK (business_status IN ('JUSTIFIEE', 'ACCEPTEE', 'ATTENUEE', 'REMEDIEE') OR business_status IS NULL),
    status_updated_at TIMESTAMP,
    status_updated_by VARCHAR(100),
    rssi_comment TEXT,
    user_comment TEXT,
    -- Statut RSSI
    rssi_status VARCHAR(50) DEFAULT 'A traiter',
    -- Statut Métier
    metier_status VARCHAR(50) DEFAULT 'A traiter',
    -- Colonnes CVSS modifiées (ajustements manuels)
    modified_score DECIMAL(3,1),
    modified_severity VARCHAR(20),
    modified_vector TEXT,
    -- Colonnes de traçabilité des modifications
    modified_at TIMESTAMP,
    modified_by VARCHAR(255),
    -- Champs enrichis (compatibilité Cyberwatch)
    epss_score DECIMAL(5,2),
    exploit_level VARCHAR(50),
    is_priority BOOLEAN DEFAULT FALSE,
    is_ignored BOOLEAN DEFAULT FALSE,
    ignored_date TIMESTAMP,
    cisa_kev_date TIMESTAMP,
    cert_fr_ale_date TIMESTAMP,
    asset_groups TEXT,
    last_scan_date TIMESTAMP,
    -- Commentaires
    comments JSONB,
    -- Commentaires analystes et validateurs
    comments_analyst TEXT,
    comments_validator TEXT,
    -- Colonnes obsolescence
    obsolescence_detected BOOLEAN DEFAULT FALSE,
    obsolescence_info TEXT,
    CONSTRAINT vulnerability_results_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Index vulnerability_results
CREATE INDEX IF NOT EXISTS idx_vr_cve ON vulnerability_results(cve_id);
CREATE INDEX IF NOT EXISTS idx_vr_asset ON vulnerability_results(asset_id);
CREATE INDEX IF NOT EXISTS idx_vr_scan ON vulnerability_results(scan_name);
CREATE INDEX IF NOT EXISTS idx_vr_severity ON vulnerability_results(base_severity);
CREATE INDEX IF NOT EXISTS idx_vr_score ON vulnerability_results(base_score);
CREATE INDEX IF NOT EXISTS idx_vuln_treatment_status ON vulnerability_results(treatment_status);
CREATE INDEX IF NOT EXISTS idx_vuln_business_status ON vulnerability_results(business_status);
CREATE INDEX IF NOT EXISTS idx_vulnerability_results_obsolescence ON vulnerability_results(obsolescence_detected) WHERE obsolescence_detected = TRUE;

-- ========================================
-- PARTIE 4: TABLES DE CONFORMITÉ ET ACTIONS (CORRIGÉES)
-- ========================================

-- IMPORTANT: Structure corrigée selon l'entité JPA ComplianceRule

CREATE TABLE compliance_rules (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    framework VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,
    status VARCHAR(50),
    affected_assets INTEGER DEFAULT 0,
    last_checked TIMESTAMP,
    remediation TEXT,
    category VARCHAR(100),
    automated BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_compliance_reference ON compliance_rules(reference);
CREATE INDEX IF NOT EXISTS idx_compliance_framework ON compliance_rules(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_level ON compliance_rules(level);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_rules(status);

CREATE TABLE cve_history (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    change_date TIMESTAMP DEFAULT NOW(),
    changed_by VARCHAR(255),
    field_changed VARCHAR(100),
    old_score DECIMAL(3,1),
    new_score DECIMAL(3,1),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_cve ON cve_history(cve_id);
CREATE INDEX IF NOT EXISTS idx_history_date ON cve_history(change_date);

CREATE TABLE corrective_actions (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(100),
    action_description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_actions_cve ON corrective_actions(cve_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON corrective_actions(status);

-- ========================================
-- PARTIE 5: TABLES D'AUTHENTIFICATION
-- ========================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CONSULTANT', 'AUTEUR', 'ADMINISTRATEUR', 'MAINTENANCE')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    first_name VARCHAR(50),
    last_name VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_enabled ON users(enabled);

CREATE TABLE group_users (
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(100),
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT group_users_group_id_fkey FOREIGN KEY (group_id) REFERENCES asset_groups(id) ON DELETE CASCADE,
    CONSTRAINT group_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_users_user_id ON group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_users_group_id ON group_users(group_id);

-- ========================================
-- PARTIE 6: TABLES D'AUDIT ET LOGS (CORRIGÉES)
-- ========================================

-- IMPORTANT: Structure corrigée selon l'entité JPA AuditLog

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    action_target VARCHAR(255),
    target_id VARCHAR(255),
    action_description TEXT,
    action_details TEXT,
    action_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    old_value TEXT,
    new_value TEXT,
    status VARCHAR(50) DEFAULT 'SUCCESS',
    error_message TEXT,
    CONSTRAINT audit_logs_action_type_check CHECK (
        action_type IN (
            'SCAN_IMPORT',
            'JUSTIFICATION',
            'CVSS_ADJUSTMENT',
            'STATUS_CHANGE',
            'EXPORT',
            'DATABASE_UPDATE',
            'CREATE',
            'UPDATE',
            'DELETE',
            'LOGIN',
            'LOGOUT'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(action_target);
CREATE INDEX IF NOT EXISTS idx_audit_logs_combined ON audit_logs(user_id, action_type, action_timestamp DESC);

CREATE TABLE group_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id BIGINT,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    CONSTRAINT group_audit_logs_group_id_fkey FOREIGN KEY (group_id) REFERENCES asset_groups(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_group_audit_group_id ON group_audit_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_performed_at ON group_audit_logs(performed_at DESC);

-- ========================================
-- PARTIE 7: TABLES CPE ET MAPPINGS
-- ========================================

CREATE TABLE cpe_index (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    cpe_string TEXT,
    vendor VARCHAR(255),
    product VARCHAR(255),
    version VARCHAR(255),
    version_start_including VARCHAR(100),
    version_start_excluding VARCHAR(100),
    version_end_including VARCHAR(100),
    version_end_excluding VARCHAR(100),
    is_vulnerable BOOLEAN DEFAULT true,
    CONSTRAINT cpe_index_cve_id_fkey FOREIGN KEY (cve_id) REFERENCES cves(cve_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cpe_cve_id ON cpe_index(cve_id);
CREATE INDEX IF NOT EXISTS idx_cpe_vendor ON cpe_index(vendor);
CREATE INDEX IF NOT EXISTS idx_cpe_product ON cpe_index(product);
CREATE INDEX IF NOT EXISTS idx_cpe_version ON cpe_index(version);
CREATE INDEX IF NOT EXISTS idx_cpe_vendor_product ON cpe_index(vendor, product);

-- New table: scans

CREATE TABLE scans (
    id BIGSERIAL PRIMARY KEY,
    scan_name VARCHAR(255) UNIQUE NOT NULL,
    os_name VARCHAR(100),
    os_version VARCHAR(100),
    hostname VARCHAR(255),
    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scans_scan_name ON scans(scan_name);

-- New table: scan_imports

CREATE TABLE scan_imports (
    id BIGSERIAL PRIMARY KEY,
    scan_name VARCHAR(255) UNIQUE NOT NULL,
    file_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    total_packages INTEGER DEFAULT 0,
    imported_packages INTEGER DEFAULT 0,
    failed_packages INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: scan_import_logs

CREATE TABLE scan_import_logs (
    id BIGSERIAL PRIMARY KEY,
    scan_import_id BIGINT,
    level VARCHAR(20),
    message TEXT,
    package_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT scan_import_logs_scan_import_id_fkey FOREIGN KEY (scan_import_id) REFERENCES scan_imports(id) ON DELETE CASCADE
);

CREATE INDEX idx_scan_import_logs_scan_import_id ON scan_import_logs(scan_import_id);

-- New table: cve_justification_history

CREATE TABLE cve_justification_history (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) UNIQUE NOT NULL,
    package_name VARCHAR(255),
    package_version VARCHAR(100),
    cve_description TEXT,
    base_score DECIMAL(3,1),
    base_severity VARCHAR(20),
    version_cvss VARCHAR(20),
    technologies_affectees TEXT,
    cpe_criteria JSONB,
    cwe TEXT,
    exploit_poc VARCHAR(10),
    exploit_references TEXT,
    comments_analyst JSONB,
    comments_validator JSONB,
    justified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_scan_name VARCHAR(255),
    asset_id BIGINT,
    vector_string TEXT,
    published_date TIMESTAMP,
    last_modified_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cve_justification_history_cve_id ON cve_justification_history(cve_id);
CREATE INDEX idx_cve_justification_history_asset_id ON cve_justification_history(asset_id);

-- New table: justification_attachments

CREATE TABLE justification_attachments (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(100) NOT NULL,
    description TEXT,
    vulnerability_id BIGINT NOT NULL,
    CONSTRAINT justification_attachments_vulnerability_id_fkey FOREIGN KEY (vulnerability_id) REFERENCES vulnerability_results(id) ON DELETE CASCADE
);

CREATE INDEX idx_justification_attachments_vulnerability_id ON justification_attachments(vulnerability_id);

CREATE TABLE cpe_mappings (
    id BIGSERIAL PRIMARY KEY,
    package_name VARCHAR(500) NOT NULL,
    package_version VARCHAR(100),
    cpe_uri VARCHAR(1000) NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    product VARCHAR(255) NOT NULL,
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    last_used_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    is_validated BOOLEAN DEFAULT FALSE,
    CONSTRAINT uk_cpe_mapping UNIQUE (package_name, package_version)
);

CREATE INDEX IF NOT EXISTS idx_cpe_mappings_package_name ON cpe_mappings(package_name);
CREATE INDEX IF NOT EXISTS idx_cpe_mappings_vendor_product ON cpe_mappings(vendor, product);
CREATE INDEX IF NOT EXISTS idx_cpe_mappings_is_active ON cpe_mappings(is_active);
CREATE INDEX IF NOT EXISTS idx_cpe_mappings_confidence ON cpe_mappings(confidence_level);
CREATE INDEX IF NOT EXISTS idx_cpe_mappings_usage_count ON cpe_mappings(usage_count DESC);

-- ========================================
-- PARTIE 8: TABLES D'OBSOLESCENCE TECHNOLOGIQUE
-- ========================================

CREATE TABLE technology_obsolescence (
    id BIGSERIAL PRIMARY KEY,
    technology_name VARCHAR(255) NOT NULL,
    version_pattern VARCHAR(100),
    latest_version VARCHAR(100),
    is_obsolete BOOLEAN NOT NULL DEFAULT FALSE,
    end_of_support DATE,
    end_of_life DATE,
    replacement_recommendation VARCHAR(500),
    justification TEXT,
    created_by VARCHAR(100),
    created_at DATE DEFAULT CURRENT_DATE,
    updated_at DATE DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_tech_obs_name ON technology_obsolescence(technology_name);
CREATE INDEX IF NOT EXISTS idx_tech_obs_obsolete ON technology_obsolescence(is_obsolete);

-- ========================================
-- PARTIE 9: CONTRAINTES DE CLÉS ÉTRANGÈRES
-- ========================================

-- FK Assets
ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_group;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_parent;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS fk_assets_previous_version;

ALTER TABLE assets ADD CONSTRAINT fk_assets_group 
    FOREIGN KEY (asset_group_id) REFERENCES asset_groups(id) ON DELETE SET NULL;
ALTER TABLE assets ADD CONSTRAINT fk_assets_parent 
    FOREIGN KEY (parent_asset_id) REFERENCES assets(id) ON DELETE SET NULL;
ALTER TABLE assets ADD CONSTRAINT fk_assets_previous_version 
    FOREIGN KEY (previous_version_id) REFERENCES assets(id) ON DELETE SET NULL;

-- ========================================
-- PARTIE 10: FONCTIONS ET TRIGGERS
-- ========================================

-- Fonction pour mettre à jour updated_at de cpe_mappings
CREATE OR REPLACE FUNCTION update_cpe_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cpe_mappings_updated_at ON cpe_mappings;
CREATE TRIGGER trg_cpe_mappings_updated_at
    BEFORE UPDATE ON cpe_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_cpe_mappings_updated_at();

-- Fonction pour mettre à jour updated_at de technology_obsolescence
CREATE OR REPLACE FUNCTION update_obsolescence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_DATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_obsolescence_timestamp ON technology_obsolescence;
CREATE TRIGGER trigger_update_obsolescence_timestamp
    BEFORE UPDATE ON technology_obsolescence
    FOR EACH ROW
    EXECUTE FUNCTION update_obsolescence_timestamp();

-- Fonction pour vérifier si une technologie est obsolète
CREATE OR REPLACE FUNCTION is_technology_obsolete(tech_name VARCHAR, tech_version VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
BEGIN
    SELECT COALESCE(o.is_obsolete, FALSE) INTO result
    FROM technology_obsolescence o
    WHERE o.technology_name = tech_name
      AND (o.version_pattern IS NULL OR tech_version LIKE o.version_pattern)
      AND o.is_obsolete = TRUE
    LIMIT 1;
    
    RETURN COALESCE(result, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PARTIE 11: VUES
-- ========================================

-- Vue pour faciliter les exports avec informations d'obsolescence
CREATE OR REPLACE VIEW vulnerabilities_with_obsolescence AS
SELECT 
    v.*,
    o.is_obsolete,
    o.end_of_support,
    o.end_of_life,
    o.latest_version AS recommended_version,
    o.replacement_recommendation
FROM vulnerability_results v
LEFT JOIN technology_obsolescence o 
    ON v.package_name = o.technology_name 
    AND (o.version_pattern IS NULL OR v.package_version LIKE o.version_pattern);

-- ========================================
-- PARTIE 12: DONNÉES INITIALES
-- ========================================

-- Groupe par défaut
INSERT INTO asset_groups (name, description, created_by)
VALUES ('Non classé', 'Groupe par défaut pour les assets non affectés', 'system')
ON CONFLICT (name) DO NOTHING;

-- Utilisateur maintenance (mot de passe : admin@2025)
INSERT INTO users (username, email, password, role, first_name, last_name, enabled)
VALUES (
    'maintenance',
    'maintenance@vmut.local',
    '$2b$12$vxnnTCe.cAowRJ0aYvlZ6Ob/7cfNZPab2BTBfHwshy3Wyt3nmOwae',
    'MAINTENANCE',
    'Admin',
    'Maintenance',
    true
)
ON CONFLICT (username) DO NOTHING;

-- Règles de conformité par défaut
INSERT INTO compliance_rules (reference, name, description, framework, level, status, affected_assets, last_checked, remediation, category, automated)
VALUES
    ('CIS-Windows-10-1.1.1', 
     'Ensure ''Allow access to BitLocker-protected fixed data drives from earlier versions of Windows'' is set to ''Disabled''',
     'Empêche l''accès aux lecteurs BitLocker depuis des versions antérieures de Windows',
     'CIS', 'ÉLEVÉE', 'non-compliant', 5, NOW() - INTERVAL '2 days',
     'Configurer la stratégie de groupe : Computer Configuration\Policies\Administrative Templates\Windows Components\BitLocker Drive Encryption\Fixed Data Drives',
     'System', true),
    ('CIS-Windows-11-1.1.2',
     'Ensure ''Allow enhanced PINs for startup'' is set to ''Enabled''',
     'Permet l''utilisation de codes PIN renforcés pour le démarrage',
     'CIS', 'MOYENNE', 'compliant', 0, NOW() - INTERVAL '1 day',
     'Configurer via GPO', 'System', true),
    ('NIST-AC-1',
     'Access Control Policy and Procedures',
     'Développer et maintenir une politique et des procédures de contrôle d''accès',
     'NIST', 'CRITIQUE', 'partial', 3, NOW() - INTERVAL '5 days',
     'Documenter et implémenter des politiques de contrôle d''accès formelles',
     'System', false),
    ('ISO-27001-A.9.2.1',
     'User registration and de-registration',
     'Processus formels d''enregistrement et de désinscription des utilisateurs',
     'ISO', 'ÉLEVÉE', 'non-compliant', 8, NOW() - INTERVAL '4 days',
     'Implémenter un processus formel de gestion des identités utilisateurs',
     'System', false),
    ('PCI-DSS-2.1',
     'Always change vendor-supplied defaults',
     'Modifier tous les paramètres par défaut fournis par les fournisseurs',
     'PCI-DSS', 'CRITIQUE', 'non-compliant', 15, NOW() - INTERVAL '7 days',
     'Changer tous les mots de passe, clés et paramètres par défaut',
     'System', true),
    ('GDPR-Art-32',
     'Security of processing',
     'Sécurité du traitement des données personnelles',
     'GDPR', 'CRITIQUE', 'compliant', 0, NOW(),
     'Implémenter des mesures techniques et organisationnelles appropriées',
     'Application', false)
ON CONFLICT (reference) DO NOTHING;

-- Données d'obsolescence technologique
INSERT INTO technology_obsolescence (technology_name, version_pattern, latest_version, is_obsolete, end_of_support, end_of_life, replacement_recommendation, justification, created_by) VALUES
-- Java
('java', '1.6.%', '21.0.1', true, '2015-12-31', '2018-12-31', 'Java 21 LTS', 'Java 6 n''est plus supporté depuis 2015', 'system'),
('java', '1.7.%', '21.0.1', true, '2019-07-31', '2022-07-31', 'Java 21 LTS', 'Java 7 n''est plus supporté depuis 2019', 'system'),
('java', '1.8.%', '21.0.1', false, '2030-12-31', null, 'Java 21 LTS recommandé', 'Java 8 LTS supporté jusqu''en 2030', 'system'),
-- Log4j
('log4j', '2.0.%', '2.23.0', true, '2021-12-31', '2021-12-31', 'Log4j 2.23.0+', 'Versions affectées par Log4Shell (CVE-2021-44228)', 'system'),
('log4j', '2.14.%', '2.23.0', true, '2021-12-31', '2021-12-31', 'Log4j 2.23.0+', 'Versions affectées par Log4Shell', 'system'),
-- Spring
('spring-core', '4.%', '6.2.0', true, '2020-12-31', '2023-12-31', 'Spring 6.x', 'Spring 4 n''est plus supporté', 'system'),
('spring-boot', '2.6.%', '3.4.0', false, '2023-11-24', null, 'Spring Boot 3.4.x', 'Support OSS terminé', 'system'),
-- Python
('python', '2.7.%', '3.12.0', true, '2020-01-01', '2020-01-01', 'Python 3.12', 'Python 2.7 n''est plus supporté depuis 2020', 'system'),
('python', '3.6.%', '3.12.0', true, '2021-12-23', '2021-12-23', 'Python 3.12', 'Python 3.6 n''est plus supporté', 'system'),
-- Node.js
('nodejs', '10.%', '20.11.0', true, '2021-04-30', '2021-04-30', 'Node.js 20 LTS', 'Node.js 10 n''est plus supporté', 'system'),
('nodejs', '14.%', '20.11.0', true, '2023-04-30', '2023-04-30', 'Node.js 20 LTS', 'Node.js 14 n''est plus supporté', 'system'),
-- Windows
('windows', '7.%', '11', true, '2015-01-13', '2020-01-14', 'Windows 11', 'Windows 7 n''est plus supporté depuis 2020', 'system'),
('windows', '10.%', '11', false, '2025-10-14', null, 'Windows 11', 'Windows 10 support jusqu''en octobre 2025', 'system')
ON CONFLICT DO NOTHING;

-- Mettre à jour validity_status "Non disponible" vers NULL
UPDATE vulnerability_results 
SET validity_status = NULL 
WHERE validity_status = 'Non disponible';

-- ========================================
-- PARTIE 13: PERMISSIONS
-- ========================================

-- Créer l'utilisateur de l'application s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'mbdhackuity') THEN
        CREATE USER mbdhackuity WITH PASSWORD 'vmut2026';
        RAISE NOTICE 'Utilisateur mbdhackuity créé';
    END IF;
END $$;

-- Accorder toutes les permissions à mbdhackuity et postgres
GRANT ALL PRIVILEGES ON DATABASE mbdhackuity TO mbdhackuity;
GRANT ALL PRIVILEGES ON SCHEMA public TO mbdhackuity;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mbdhackuity;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mbdhackuity;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mbdhackuity;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO mbdhackuity;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO mbdhackuity;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO mbdhackuity;

-- Rendre mbdhackuity propriétaire de toutes les tables pour permettre ALTER TABLE
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' OWNER TO mbdhackuity';
    END LOOP;
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' OWNER TO mbdhackuity';
    END LOOP;
END $$;

-- Également accorder à postgres (utilisateur admin)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

RAISE NOTICE 'Permissions accordées à mbdhackuity et postgres';

-- ========================================
-- PARTIE 14: CORRECTION AUTOMATIQUE DES TYPES DE COLONNES
-- ========================================

-- Cette section garantit que toutes les colonnes référençant des IDs
-- sont bien de type BIGINT pour la compatibilité avec Hibernate/JPA
DO $$
DECLARE
    correction_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 VÉRIFICATION ET CORRECTION DES TYPES DE COLONNES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Correction cve_matches.asset_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cve_matches' 
        AND column_name = 'asset_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE cve_matches ALTER COLUMN asset_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: cve_matches.asset_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ cve_matches.asset_id est déjà BIGINT';
    END IF;
    
    -- Correction vulnerability_results.asset_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vulnerability_results' 
        AND column_name = 'asset_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE vulnerability_results ALTER COLUMN asset_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: vulnerability_results.asset_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ vulnerability_results.asset_id est déjà BIGINT';
    END IF;
    
    -- Correction cve_justification_history.asset_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cve_justification_history' 
        AND column_name = 'asset_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE cve_justification_history ALTER COLUMN asset_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: cve_justification_history.asset_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ cve_justification_history.asset_id est déjà BIGINT';
    END IF;
    
    -- Correction assets.parent_asset_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' 
        AND column_name = 'parent_asset_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE assets ALTER COLUMN parent_asset_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: assets.parent_asset_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ assets.parent_asset_id est déjà BIGINT';
    END IF;
    
    -- Correction assets.previous_version_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assets' 
        AND column_name = 'previous_version_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE assets ALTER COLUMN previous_version_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: assets.previous_version_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ assets.previous_version_id est déjà BIGINT';
    END IF;
    
    -- Correction group_users.group_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_users' 
        AND column_name = 'group_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE group_users ALTER COLUMN group_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: group_users.group_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ group_users.group_id est déjà BIGINT';
    END IF;
    
    -- Correction group_users.user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_users' 
        AND column_name = 'user_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE group_users ALTER COLUMN user_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: group_users.user_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ group_users.user_id est déjà BIGINT';
    END IF;
    
    -- Correction group_audit_logs.group_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_audit_logs' 
        AND column_name = 'group_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE group_audit_logs ALTER COLUMN group_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: group_audit_logs.group_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ group_audit_logs.group_id est déjà BIGINT';
    END IF;
    
    -- Correction group_audit_logs.target_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_audit_logs' 
        AND column_name = 'target_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE group_audit_logs ALTER COLUMN target_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: group_audit_logs.target_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ group_audit_logs.target_id est déjà BIGINT';
    END IF;
    
    -- Correction scan_import_logs.scan_import_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scan_import_logs' 
        AND column_name = 'scan_import_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE scan_import_logs ALTER COLUMN scan_import_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: scan_import_logs.scan_import_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ scan_import_logs.scan_import_id est déjà BIGINT';
    END IF;
    
    -- Correction justification_attachments.vulnerability_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'justification_attachments' 
        AND column_name = 'vulnerability_id' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE justification_attachments ALTER COLUMN vulnerability_id TYPE BIGINT;
        correction_count := correction_count + 1;
        RAISE NOTICE '✅ Correction: justification_attachments.vulnerability_id → BIGINT';
    ELSE
        RAISE NOTICE '✓ justification_attachments.vulnerability_id est déjà BIGINT';
    END IF;
    
    RAISE NOTICE '';
    IF correction_count > 0 THEN
        RAISE NOTICE '🔧 % colonnes corrigées de INTEGER vers BIGINT', correction_count;
    ELSE
        RAISE NOTICE '✅ Aucune correction nécessaire - tous les types sont corrects';
    END IF;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Réactiver les contraintes
SET session_replication_role = 'origin';

-- ========================================
-- PARTIE 15: COMMENTAIRES SUR LES OBJETS
-- ========================================

COMMENT ON TABLE technology_obsolescence IS 'Table pour gérer l''obsolescence des technologies et recommander les mises à jour';
COMMENT ON TABLE compliance_rules IS 'Règles de conformité pour les frameworks de sécurité (CIS, NIST, ISO, PCI-DSS, GDPR)';
COMMENT ON TABLE audit_logs IS 'Journal d''audit pour tracer toutes les actions utilisateurs';
COMMENT ON TABLE vulnerability_results IS 'Résultats des scans de vulnérabilités avec enrichissement CVE';
COMMENT ON TABLE cpe_mappings IS 'Mappings personnalisés entre packages et CPE pour améliorer la détection';
COMMENT ON VIEW vulnerabilities_with_obsolescence IS 'Vue combinant les vulnérabilités avec les informations d''obsolescence technologique';

-- ========================================
-- PARTIE 16: VÉRIFICATIONS FINALES
-- ========================================

DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
    function_count INTEGER;
    rec RECORD;
    bigint_check RECORD;
    all_bigint BOOLEAN := TRUE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SETUP VMUT COMPLET TERMINÉ';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- Compter les objets créés
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO view_count
    FROM information_schema.views
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    
    RAISE NOTICE 'Tables créées: %', table_count;
    RAISE NOTICE 'Vues créées: %', view_count;
    RAISE NOTICE 'Fonctions créées: %', function_count;
    RAISE NOTICE '';
    
    -- Statistiques des données
    RAISE NOTICE 'Données initiales:';
    FOR rec IN 
        SELECT 
            (SELECT COUNT(*) FROM cves) as cves,
            (SELECT COUNT(*) FROM assets) as assets,
            (SELECT COUNT(*) FROM vulnerability_results) as vulnerabilites,
            (SELECT COUNT(*) FROM compliance_rules) as regles_conformite,
            (SELECT COUNT(*) FROM technology_obsolescence) as tech_obsoletes,
            (SELECT COUNT(*) FROM users) as utilisateurs,
            (SELECT COUNT(*) FROM asset_groups) as groupes
    LOOP
        RAISE NOTICE '  - CVEs: %', rec.cves;
        RAISE NOTICE '  - Assets: %', rec.assets;
        RAISE NOTICE '  - Vulnérabilités: %', rec.vulnerabilites;
        RAISE NOTICE '  - Règles de conformité: %', rec.regles_conformite;
        RAISE NOTICE '  - Technologies obsolètes: %', rec.tech_obsoletes;
        RAISE NOTICE '  - Utilisateurs: %', rec.utilisateurs;
        RAISE NOTICE '  - Groupes: %', rec.groupes;
    END LOOP;
    
    RAISE NOTICE '';
    
    -- Vérification finale des types de colonnes critiques
    RAISE NOTICE '🔍 Vérification des types de colonnes critiques:';
    FOR bigint_check IN
        SELECT 
            table_name, 
            column_name, 
            data_type,
            CASE 
                WHEN data_type = 'bigint' THEN '✅'
                WHEN data_type = 'integer' THEN '❌'
                ELSE '⚠️'
            END as status
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ('asset_id', 'parent_asset_id', 'previous_version_id', 
                             'group_id', 'user_id', 'target_id', 'scan_import_id', 'vulnerability_id')
        ORDER BY table_name, column_name
    LOOP
        RAISE NOTICE '  % %.% : %', bigint_check.status, bigint_check.table_name, 
                     bigint_check.column_name, bigint_check.data_type;
        IF bigint_check.data_type != 'bigint' THEN
            all_bigint := FALSE;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    
    IF all_bigint THEN
        RAISE NOTICE '✅ VALIDATION: Tous les types de colonnes sont corrects (BIGINT)';
    ELSE
        RAISE NOTICE '⚠️  ATTENTION: Certaines colonnes ne sont pas en BIGINT';
        RAISE NOTICE '   Exécutez le script fix_column_types.sql pour corriger';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT:';
    RAISE NOTICE '  1. Utilisateur par défaut: maintenance / maintenance';
    RAISE NOTICE '  2. Changez le mot de passe après la première connexion';
    RAISE NOTICE '  3. Groupe "Non classé" créé automatiquement';
    RAISE NOTICE '  4. Configurez application.properties avec:';
    RAISE NOTICE '     spring.jpa.hibernate.ddl-auto=validate';
    RAISE NOTICE '  5. Base de données utilisateur: mbdhackuity / vmut2026';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
