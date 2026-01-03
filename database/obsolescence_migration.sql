-- Migration pour ajouter le support de l'obsolescence dans les exports
-- Ce script enrichit le système d'export pour inclure les informations d'obsolescence

-- Ajouter une vue pour faciliter les exports avec informations d'obsolescence
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

COMMENT ON VIEW vulnerabilities_with_obsolescence IS 'Vue combinant les vulnérabilités avec les informations d''obsolescence technologique';

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

COMMENT ON FUNCTION is_technology_obsolete IS 'Fonction pour vérifier si une version spécifique d''une technologie est obsolète';

-- Trigger pour mettre à jour automatiquement la date de mise à jour
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

COMMENT ON TRIGGER trigger_update_obsolescence_timestamp ON technology_obsolescence IS 'Met à jour automatiquement le champ updated_at lors de modifications';
