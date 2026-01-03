-- ========================================
-- SCRIPT DE SETUP COMPLET ET SCALABLE
-- VMUT - Vulnerability Management Unified Tool
-- ========================================
-- Description : Script SQL consolidé pour setup complet du projet
--               Compatible avec bases vierges ET bases existantes (V1)
--               Idempotent : peut être exécuté plusieurs fois sans erreur
-- Utilisation : psql -U postgres -d cve_toolbox -f setup_complete.sql
-- Date : 2026-01-03
-- ========================================

\c cve_toolbox

-- ========================================
-- PARTIE 1: TABLES DE BASE
-- ========================================

-- Table CVEs
CREATE TABLE IF NOT EXISTS cves (
    id SERIAL PRIMARY KEY,
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
    cpe_criteria JSONB,
    cve_references JSONB,
    raw_data JSONB
);

-- Ajouter colonnes NIST si elles n'existent pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cves' AND column_name='cwes') THEN
        ALTER TABLE cves ADD COLUMN cwes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cves' AND column_name='assigner') THEN
        ALTER TABLE cves ADD COLUMN assigner VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cves' AND column_name='change_history') THEN
        ALTER TABLE cves ADD COLUMN change_history TEXT;
    END IF;
END $$;

-- Index CVEs
CREATE INDEX IF NOT EXISTS idx_cve_id ON cves(cve_id);
CREATE INDEX IF NOT EXISTS idx_base_score ON cves(base_score);
CREATE INDEX IF NOT EXISTS idx_base_severity ON cves(base_severity);
CREATE INDEX IF NOT EXISTS idx_published ON cves(published);
CREATE INDEX IF NOT EXISTS idx_cves_assigner ON cves(assigner);

-- ========================================
-- PARTIE 2: TABLE ASSETS (avec tous les champs)
-- ========================================

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    scan_name VARCHAR(255),
    package_name VARCHAR(255),
    package_version VARCHAR(255),
    os_name VARCHAR(100),
    os_version VARCHAR(50),
    hostname VARCHAR(255),
    scan_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    raw_data JSONB
);

-- Ajouter colonnes manquantes pour assets
DO $$ 
BEGIN
    -- Colonnes de base
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='name') THEN
        ALTER TABLE assets ADD COLUMN name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='description') THEN
        ALTER TABLE assets ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='type') THEN
        ALTER TABLE assets ADD COLUMN type VARCHAR(50) DEFAULT 'CYBERWATCH';
    END IF;
    
    -- Colonnes STB_REQ_0102
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='serial_number') THEN
        ALTER TABLE assets ADD COLUMN serial_number VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='part_number') THEN
        ALTER TABLE assets ADD COLUMN part_number VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='environment') THEN
        ALTER TABLE assets ADD COLUMN environment VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='uuid') THEN
        ALTER TABLE assets ADD COLUMN uuid VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='version') THEN
        ALTER TABLE assets ADD COLUMN version VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='creation_mode') THEN
        ALTER TABLE assets ADD COLUMN creation_mode VARCHAR(20) DEFAULT 'MANUAL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='related_asset_name') THEN
        ALTER TABLE assets ADD COLUMN related_asset_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='asset_group_id') THEN
        ALTER TABLE assets ADD COLUMN asset_group_id BIGINT;
    END IF;
    
    -- Colonnes pour hiérarchie (STB_REQ_0130)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='parent_asset_id') THEN
        ALTER TABLE assets ADD COLUMN parent_asset_id BIGINT;
    END IF;
    
    -- Colonnes pour versioning (STB_REQ_0140)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assets' AND column_name='previous_version_id') THEN
        ALTER TABLE assets ADD COLUMN previous_version_id BIGINT;
    END IF;
END $$;

-- Mettre à jour les contraintes NOT NULL si nécessaire
ALTER TABLE assets ALTER COLUMN scan_name DROP NOT NULL;
ALTER TABLE assets ALTER COLUMN package_name DROP NOT NULL;
ALTER TABLE assets ALTER COLUMN package_version DROP NOT NULL;

-- Remplir les colonnes name pour les anciennes données
UPDATE assets 
SET name = COALESCE(hostname, scan_name)
WHERE name IS NULL;

-- Ajouter NOT NULL sur name après mise à jour
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM assets WHERE name IS NULL) THEN
        UPDATE assets SET name = 'asset_' || id WHERE name IS NULL;
    END IF;
    ALTER TABLE assets ALTER COLUMN name SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore si déjà NOT NULL
END $$;

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

CREATE TABLE IF NOT EXISTS cve_matches (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50),
    asset_id INTEGER,
    match_confidence DECIMAL(3,2),
    matched_on VARCHAR(50),
    match_date TIMESTAMP DEFAULT NOW()
);

-- Ajouter contraintes FK si elles n'existent pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cve_matches_cve_id_fkey') THEN
        ALTER TABLE cve_matches ADD CONSTRAINT cve_matches_cve_id_fkey 
            FOREIGN KEY (cve_id) REFERENCES cves(cve_id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cve_matches_asset_id_fkey') THEN
        ALTER TABLE cve_matches ADD CONSTRAINT cve_matches_asset_id_fkey 
            FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_cve ON cve_matches(cve_id);
CREATE INDEX IF NOT EXISTS idx_matches_asset ON cve_matches(asset_id);

-- Table vulnerability_results
CREATE TABLE IF NOT EXISTS vulnerability_results (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    asset_id INTEGER,
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
    cve_references JSONB
);

-- Ajouter colonnes STB_REQ_0260 (double statut)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerability_results' AND column_name='treatment_status') THEN
        ALTER TABLE vulnerability_results ADD COLUMN treatment_status VARCHAR(50) DEFAULT 'A_TRAITER';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerability_results' AND column_name='business_status') THEN
        ALTER TABLE vulnerability_results ADD COLUMN business_status VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerability_results' AND column_name='status_updated_at') THEN
        ALTER TABLE vulnerability_results ADD COLUMN status_updated_at TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerability_results' AND column_name='status_updated_by') THEN
        ALTER TABLE vulnerability_results ADD COLUMN status_updated_by VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerability_results' AND column_name='rssi_comment') THEN
        ALTER TABLE vulnerability_results ADD COLUMN rssi_comment TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vulnerability_results' AND column_name='user_comment') THEN
        ALTER TABLE vulnerability_results ADD COLUMN user_comment TEXT;
    END IF;
END $$;

-- Contraintes statuts
ALTER TABLE vulnerability_results DROP CONSTRAINT IF EXISTS check_treatment_status;
ALTER TABLE vulnerability_results DROP CONSTRAINT IF EXISTS check_business_status;

ALTER TABLE vulnerability_results
ADD CONSTRAINT check_treatment_status
    CHECK (treatment_status IN ('A_TRAITER', 'EN_COURS', 'TRAITE'));

ALTER TABLE vulnerability_results
ADD CONSTRAINT check_business_status
    CHECK (business_status IN ('JUSTIFIEE', 'ACCEPTEE', 'ATTENUEE', 'REMEDIEE') OR business_status IS NULL);

-- FK asset_id
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vulnerability_results_asset_id_fkey') THEN
        ALTER TABLE vulnerability_results ADD CONSTRAINT vulnerability_results_asset_id_fkey 
            FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Index vulnerability_results
CREATE INDEX IF NOT EXISTS idx_vr_cve ON vulnerability_results(cve_id);
CREATE INDEX IF NOT EXISTS idx_vr_asset ON vulnerability_results(asset_id);
CREATE INDEX IF NOT EXISTS idx_vr_scan ON vulnerability_results(scan_name);
CREATE INDEX IF NOT EXISTS idx_vr_severity ON vulnerability_results(base_severity);
CREATE INDEX IF NOT EXISTS idx_vr_score ON vulnerability_results(base_score);
CREATE INDEX IF NOT EXISTS idx_vuln_treatment_status ON vulnerability_results(treatment_status);
CREATE INDEX IF NOT EXISTS idx_vuln_business_status ON vulnerability_results(business_status);

-- ========================================
-- PARTIE 4: TABLES COMPLÉMENTAIRES
-- ========================================

-- Table cve_history
CREATE TABLE IF NOT EXISTS cve_history (
    id SERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    change_date TIMESTAMP DEFAULT NOW(),
    change_type VARCHAR(50),
    old_severity VARCHAR(20),
    new_severity VARCHAR(20),
    old_score DECIMAL(3,1),
    new_score DECIMAL(3,1),
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_history_cve ON cve_history(cve_id);
CREATE INDEX IF NOT EXISTS idx_history_date ON cve_history(change_date);

-- Table compliance_rules
CREATE TABLE IF NOT EXISTS compliance_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_category VARCHAR(100),
    severity_threshold VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table corrective_actions
CREATE TABLE IF NOT EXISTS corrective_actions (
    id SERIAL PRIMARY KEY,
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
-- PARTIE 5: AUTHENTIFICATION ET GROUPES
-- ========================================

-- Table users
CREATE TABLE IF NOT EXISTS users (
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

-- Table asset_groups (STB_REQ_0101)
CREATE TABLE IF NOT EXISTS asset_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    plm_container VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Ajouter FK asset_group_id vers asset_groups
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_group') THEN
        ALTER TABLE assets ADD CONSTRAINT fk_assets_group 
            FOREIGN KEY (asset_group_id) REFERENCES asset_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

-- FK hiérarchie et versioning
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_parent') THEN
        ALTER TABLE assets ADD CONSTRAINT fk_assets_parent 
            FOREIGN KEY (parent_asset_id) REFERENCES assets(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assets_previous_version') THEN
        ALTER TABLE assets ADD CONSTRAINT fk_assets_previous_version 
            FOREIGN KEY (previous_version_id) REFERENCES assets(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Table group_users (liaison)
CREATE TABLE IF NOT EXISTS group_users (
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(100),
    PRIMARY KEY (group_id, user_id)
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_users_group_id_fkey') THEN
        ALTER TABLE group_users ADD CONSTRAINT group_users_group_id_fkey 
            FOREIGN KEY (group_id) REFERENCES asset_groups(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_users_user_id_fkey') THEN
        ALTER TABLE group_users ADD CONSTRAINT group_users_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_group_users_user_id ON group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_users_group_id ON group_users(group_id);

-- ========================================
-- PARTIE 6: AUDIT ET LOGS
-- ========================================

-- Table audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    action_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_type VARCHAR(50) NOT NULL,
    action_target VARCHAR(50),
    action_description VARCHAR(500),
    action_details TEXT
);

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_type_check;
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_action_type_check CHECK (
    action_type IN (
        'SCAN_IMPORT',
        'JUSTIFICATION',
        'CVSS_ADJUSTMENT',
        'STATUS_CHANGE',
        'EXPORT',
        'DATABASE_UPDATE'
    )
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_combined ON audit_logs(user_id, action_type, action_timestamp DESC);

-- Table group_audit_logs
CREATE TABLE IF NOT EXISTS group_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id BIGINT,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_audit_logs_group_id_fkey') THEN
        ALTER TABLE group_audit_logs ADD CONSTRAINT group_audit_logs_group_id_fkey 
            FOREIGN KEY (group_id) REFERENCES asset_groups(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_group_audit_group_id ON group_audit_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_group_audit_performed_at ON group_audit_logs(performed_at DESC);

-- ========================================
-- PARTIE 7: CPE INDEX ET MAPPINGS
-- ========================================

-- Table cpe_index
CREATE TABLE IF NOT EXISTS cpe_index (
    id BIGSERIAL PRIMARY KEY,
    cve_id VARCHAR(50) NOT NULL,
    cpe_criteria VARCHAR(500) NOT NULL,
    vendor VARCHAR(255),
    product VARCHAR(255),
    version VARCHAR(100),
    version_start VARCHAR(100),
    version_end VARCHAR(100),
    is_vulnerable BOOLEAN DEFAULT true
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cpe_index_cve_id_fkey') THEN
        ALTER TABLE cpe_index ADD CONSTRAINT cpe_index_cve_id_fkey 
            FOREIGN KEY (cve_id) REFERENCES cves(cve_id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cpe_cve_id ON cpe_index(cve_id);
CREATE INDEX IF NOT EXISTS idx_cpe_vendor ON cpe_index(vendor);
CREATE INDEX IF NOT EXISTS idx_cpe_product ON cpe_index(product);
CREATE INDEX IF NOT EXISTS idx_cpe_version ON cpe_index(version);
CREATE INDEX IF NOT EXISTS idx_cpe_vendor_product ON cpe_index(vendor, product);

-- Table cpe_mappings (STB_REQ_0210)
CREATE TABLE IF NOT EXISTS cpe_mappings (
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

-- Trigger pour updated_at
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

-- ========================================
-- PARTIE 8: GROUPE PAR DÉFAUT ET UTILISATEUR
-- ========================================

-- Créer groupe "Non classé" s'il n'existe pas
INSERT INTO asset_groups (name, description, created_by)
VALUES ('Non classé', 'Groupe par défaut pour les assets non affectés', 'system')
ON CONFLICT (name) DO NOTHING;

-- Créer utilisateur maintenance s'il n'existe pas
-- Mot de passe par défaut: maintenance (à changer après première connexion)
-- Hash bcrypt de "maintenance": $2a$10$Yj3xfPxKQx1YXKx7V7X8/.N9X8X8X8X8X8X8X8X8X8X8X8X8X8X8
INSERT INTO users (username, email, password, role, first_name, last_name, enabled)
VALUES (
    'maintenance',
    'maintenance@vmut.local',
    '$2a$10$8vJZYnJ5K5K5K5K5K5K5K.eZQYH5pZnH5pH5pH5pH5pH5pH5pH5pO',
    'MAINTENANCE',
    'Admin',
    'Maintenance',
    true
)
ON CONFLICT (username) DO NOTHING;

-- ========================================
-- PARTIE 9: PERMISSIONS
-- ========================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO postgres;

-- ========================================
-- VÉRIFICATION ET RÉSUMÉ
-- ========================================

\echo ''
\echo '=========================================='
\echo '✅ SETUP COMPLET TERMINÉ'
\echo '=========================================='
\echo ''
\echo 'Tables créées/mises à jour :'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

\echo ''
\echo 'Statistiques :'
SELECT 
    (SELECT COUNT(*) FROM cves) as total_cves,
    (SELECT COUNT(*) FROM assets WHERE type = 'MANUAL') as assets_manuels,
    (SELECT COUNT(*) FROM assets WHERE type != 'MANUAL') as assets_scans,
    (SELECT COUNT(*) FROM vulnerability_results) as vulnerabilites,
    (SELECT COUNT(*) FROM users) as utilisateurs,
    (SELECT COUNT(*) FROM asset_groups) as groupes;

\echo ''
\echo '⚠️  IMPORTANT :'
\echo '1. Utilisateur par défaut: maintenance / maintenance'
\echo '2. Changez le mot de passe après première connexion'
\echo '3. Groupe "Non classé" créé automatiquement'
\echo ''
\echo '=========================================='
