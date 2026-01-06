-- ========================================
-- SCRIPT DE CORRECTION DES PERMISSIONS
-- VMUT - Vulnerability Management Unified Tool
-- ========================================
-- Description : Corrige les permissions sans supprimer les données
-- Utilisation : psql -U postgres -d cve_toolbox -f fix_permissions.sql
-- Date : 2026-01-06
-- ========================================

\c cve_toolbox

-- ========================================
-- PARTIE 1: IDENTIFIER L'UTILISATEUR
-- ========================================

DO $$
DECLARE
    app_user TEXT;
    table_owner TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC DES PERMISSIONS';
    RAISE NOTICE '========================================';
    
    -- Afficher l'utilisateur courant
    RAISE NOTICE 'Utilisateur courant: %', current_user;
    
    -- Vérifier le propriétaire de la table audit_logs
    SELECT tableowner INTO table_owner
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'audit_logs';
    
    IF table_owner IS NOT NULL THEN
        RAISE NOTICE 'Propriétaire de audit_logs: %', table_owner;
    ELSE
        RAISE NOTICE 'La table audit_logs n''existe pas encore';
    END IF;
    
    -- Vérifier le propriétaire de la table compliance_rules
    SELECT tableowner INTO table_owner
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'compliance_rules';
    
    IF table_owner IS NOT NULL THEN
        RAISE NOTICE 'Propriétaire de compliance_rules: %', table_owner;
    ELSE
        RAISE NOTICE 'La table compliance_rules n''existe pas encore';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- PARTIE 2: CORRIGER LES PERMISSIONS
-- ========================================

-- Option 1 : Accorder les permissions à tous les utilisateurs (si vous ne connaissez pas l'utilisateur de l'app)
DO $$
BEGIN
    RAISE NOTICE 'Accord des permissions à PUBLIC...';
    
    -- Tables
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO PUBLIC;
    
    -- Séquences
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
    
    RAISE NOTICE 'Permissions accordées à PUBLIC';
END $$;

-- Option 2 : Accorder les permissions à un utilisateur spécifique
-- Décommentez et remplacez 'votre_user_app' par le nom réel de l'utilisateur
/*
DO $$
DECLARE
    app_user TEXT := 'votre_user_app'; -- MODIFIER ICI
BEGIN
    RAISE NOTICE 'Accord des permissions à %...', app_user;
    
    -- Vérifier que l'utilisateur existe
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = app_user) THEN
        -- Tables
        EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %I', app_user);
        
        -- Séquences
        EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', app_user);
        
        -- Tables futures
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %I', app_user);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I', app_user);
        
        RAISE NOTICE 'Permissions accordées à %', app_user;
    ELSE
        RAISE EXCEPTION 'L''utilisateur % n''existe pas', app_user;
    END IF;
END $$;
*/

-- ========================================
-- PARTIE 3: CORRIGER LA TABLE COMPLIANCE_RULES SI NÉCESSAIRE
-- ========================================

-- Renommer la colonne si elle existe avec le mauvais nom
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'rule_name'
    ) THEN
        RAISE NOTICE 'Renommage de rule_name en name...';
        ALTER TABLE compliance_rules RENAME COLUMN rule_name TO name;
        RAISE NOTICE 'Colonne renommée avec succès';
    ELSE
        RAISE NOTICE 'La colonne name existe déjà ou la table n''existe pas';
    END IF;
    
    -- Ajouter les colonnes manquantes si nécessaire
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'reference'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne reference...';
        ALTER TABLE compliance_rules ADD COLUMN reference VARCHAR(255) UNIQUE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'framework'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne framework...';
        ALTER TABLE compliance_rules ADD COLUMN framework VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'level'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne level...';
        ALTER TABLE compliance_rules ADD COLUMN level VARCHAR(20) NOT NULL DEFAULT 'MOYENNE';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne status...';
        ALTER TABLE compliance_rules ADD COLUMN status VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'affected_assets'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne affected_assets...';
        ALTER TABLE compliance_rules ADD COLUMN affected_assets INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'last_checked'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne last_checked...';
        ALTER TABLE compliance_rules ADD COLUMN last_checked TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'remediation'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne remediation...';
        ALTER TABLE compliance_rules ADD COLUMN remediation TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'category'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne category...';
        ALTER TABLE compliance_rules ADD COLUMN category VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'automated'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne automated...';
        ALTER TABLE compliance_rules ADD COLUMN automated BOOLEAN DEFAULT false;
    END IF;
    
    -- Supprimer les colonnes obsolètes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'rule_category'
    ) THEN
        RAISE NOTICE 'Suppression de la colonne obsolète rule_category...';
        ALTER TABLE compliance_rules DROP COLUMN IF EXISTS rule_category;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'severity_threshold'
    ) THEN
        RAISE NOTICE 'Suppression de la colonne obsolète severity_threshold...';
        ALTER TABLE compliance_rules DROP COLUMN IF EXISTS severity_threshold;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'compliance_rules' AND column_name = 'is_active'
    ) THEN
        RAISE NOTICE 'Suppression de la colonne obsolète is_active...';
        ALTER TABLE compliance_rules DROP COLUMN IF EXISTS is_active;
    END IF;
END $$;

-- ========================================
-- PARTIE 4: CORRIGER LA TABLE AUDIT_LOGS SI NÉCESSAIRE
-- ========================================

DO $$
BEGIN
    -- Ajouter les colonnes manquantes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'target_id'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne target_id...';
        ALTER TABLE audit_logs ADD COLUMN target_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne ip_address...';
        ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'old_value'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne old_value...';
        ALTER TABLE audit_logs ADD COLUMN old_value TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'new_value'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne new_value...';
        ALTER TABLE audit_logs ADD COLUMN new_value TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne status...';
        ALTER TABLE audit_logs ADD COLUMN status VARCHAR(50) DEFAULT 'SUCCESS';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'error_message'
    ) THEN
        RAISE NOTICE 'Ajout de la colonne error_message...';
        ALTER TABLE audit_logs ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- ========================================
-- PARTIE 5: VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VÉRIFICATION POST-CORRECTION';
    RAISE NOTICE '========================================';
    
    -- Vérifier les permissions sur audit_logs
    RAISE NOTICE 'Permissions sur audit_logs:';
    FOR rec IN 
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = 'audit_logs'
        LIMIT 5
    LOOP
        RAISE NOTICE '  - % : %', rec.grantee, rec.privilege_type;
    END LOOP;
    
    -- Vérifier les permissions sur compliance_rules
    RAISE NOTICE '';
    RAISE NOTICE 'Permissions sur compliance_rules:';
    FOR rec IN 
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = 'compliance_rules'
        LIMIT 5
    LOOP
        RAISE NOTICE '  - % : %', rec.grantee, rec.privilege_type;
    END LOOP;
    
    -- Vérifier la structure de compliance_rules
    RAISE NOTICE '';
    RAISE NOTICE 'Colonnes de compliance_rules:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'compliance_rules'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - % (%) %', rec.column_name, rec.data_type,
                     CASE WHEN rec.is_nullable = 'NO' THEN 'NOT NULL' ELSE '' END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION TERMINÉE !';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaines étapes:';
    RAISE NOTICE '1. Vérifiez que l''utilisateur de l''application a les bonnes permissions';
    RAISE NOTICE '2. Redémarrez l''application Spring Boot';
    RAISE NOTICE '3. Si les erreurs persistent, exécutez setup_fixed.sql';
END $$;
