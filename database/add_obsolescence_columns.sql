-- Script SQL pour ajouter les colonnes d'obsolescence à la table vulnerability_results
-- Date: 2025-12-31

-- Ajouter la colonne obsolescence_detected (boolean)
ALTER TABLE vulnerability_results
ADD COLUMN IF NOT EXISTS obsolescence_detected BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne obsolescence_info (texte)
ALTER TABLE vulnerability_results
ADD COLUMN IF NOT EXISTS obsolescence_info TEXT;

-- Créer un index pour optimiser les requêtes sur les technologies obsolètes
CREATE INDEX IF NOT EXISTS idx_vulnerability_results_obsolescence 
ON vulnerability_results(obsolescence_detected) 
WHERE obsolescence_detected = TRUE;

-- Commentaires sur les nouvelles colonnes
COMMENT ON COLUMN vulnerability_results.obsolescence_detected IS 'Indique si la technologie est identifiée comme obsolète';
COMMENT ON COLUMN vulnerability_results.obsolescence_info IS 'Informations détaillées sur l''obsolescence (technologie, version, dates, recommandations)';

-- Afficher le nombre de colonnes ajoutées
SELECT 
    'obsolescence_detected' as column_name,
    pg_typeof(obsolescence_detected) as data_type,
    CASE WHEN obsolescence_detected IS NULL THEN 'NULL allowed' ELSE 'NOT NULL' END as nullable
FROM vulnerability_results
LIMIT 1;

SELECT 
    'obsolescence_info' as column_name,
    pg_typeof(obsolescence_info) as data_type,
    CASE WHEN obsolescence_info IS NULL THEN 'NULL allowed' ELSE 'NOT NULL' END as nullable
FROM vulnerability_results
LIMIT 1;

-- Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'vulnerability_results' 
    AND column_name IN ('obsolescence_detected', 'obsolescence_info')
ORDER BY ordinal_position;
