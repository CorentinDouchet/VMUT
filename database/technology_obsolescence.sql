-- Table pour gérer l'obsolescence des technologies
CREATE TABLE IF NOT EXISTS technology_obsolescence (
    id BIGSERIAL PRIMARY KEY,
    technology_name VARCHAR(255) NOT NULL,
    version_pattern VARCHAR(100), -- Pattern de version (ex: "1.x", "2.*", null pour toutes)
    latest_version VARCHAR(100), -- Dernière version stable disponible
    is_obsolete BOOLEAN NOT NULL DEFAULT FALSE,
    end_of_support DATE, -- Date de fin de support
    end_of_life DATE, -- Date de fin de vie
    replacement_recommendation VARCHAR(500), -- Recommandation de remplacement
    justification TEXT, -- Justification de l'obsolescence
    created_by VARCHAR(100),
    created_at DATE DEFAULT CURRENT_DATE,
    updated_at DATE DEFAULT CURRENT_DATE
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_tech_obs_name ON technology_obsolescence(technology_name);
CREATE INDEX IF NOT EXISTS idx_tech_obs_obsolete ON technology_obsolescence(is_obsolete);

-- Données d'exemple pour technologies courantes
INSERT INTO technology_obsolescence (technology_name, version_pattern, latest_version, is_obsolete, end_of_support, end_of_life, replacement_recommendation, justification, created_by) VALUES
-- Java versions obsolètes
('java', '1.6.*', '21.0.1', true, '2015-12-31', '2018-12-31', 'Java 21 LTS', 'Java 6 n''est plus supporté depuis 2015', 'system'),
('java', '1.7.*', '21.0.1', true, '2019-07-31', '2022-07-31', 'Java 21 LTS', 'Java 7 n''est plus supporté depuis 2019', 'system'),
('java', '1.8.*', '21.0.1', false, '2030-12-31', null, 'Java 21 LTS recommandé', 'Java 8 LTS supporté jusqu''en 2030', 'system'),
('java', '11.*', '21.0.1', false, '2026-09-30', null, 'Java 21 LTS', 'Java 11 LTS supporté jusqu''en 2026', 'system'),
('java', '17.*', '21.0.1', false, '2029-09-30', null, 'Java 21 LTS', 'Java 17 LTS supporté jusqu''en 2029', 'system'),

-- Log4j versions vulnérables
('log4j', '2.0.*', '2.23.0', true, '2021-12-31', '2021-12-31', 'Log4j 2.23.0+', 'Versions affectées par Log4Shell (CVE-2021-44228)', 'system'),
('log4j', '2.1.*', '2.23.0', true, '2021-12-31', '2021-12-31', 'Log4j 2.23.0+', 'Versions affectées par Log4Shell', 'system'),
('log4j', '2.2.*', '2.23.0', true, '2021-12-31', '2021-12-31', 'Log4j 2.23.0+', 'Versions affectées par Log4Shell', 'system'),
('log4j', '2.3.*', '2.23.0', true, '2021-12-31', '2021-12-31', 'Log4j 2.23.0+', 'Versions affectées par Log4Shell', 'system'),
('log4j', '2.14.*', '2.23.0', true, '2021-12-31', '2021-12-31', 'Log4j 2.23.0+', 'Versions affectées par Log4Shell', 'system'),

-- Spring Framework
('spring-core', '4.*', '6.2.0', true, '2020-12-31', '2023-12-31', 'Spring 6.x', 'Spring 4 n''est plus supporté', 'system'),
('spring-core', '5.*', '6.2.0', false, '2024-08-31', null, 'Spring 6.x recommandé', 'Spring 5 support étendu jusqu''en août 2024', 'system'),
('spring-boot', '2.6.*', '3.4.0', false, '2023-11-24', null, 'Spring Boot 3.4.x', 'Support OSS terminé', 'system'),
('spring-boot', '2.7.*', '3.4.0', false, '2025-05-18', null, 'Spring Boot 3.4.x', 'Dernière version 2.x supportée', 'system'),

-- Node.js
('nodejs', '10.*', '20.11.0', true, '2021-04-30', '2021-04-30', 'Node.js 20 LTS', 'Node.js 10 n''est plus supporté', 'system'),
('nodejs', '12.*', '20.11.0', true, '2022-04-30', '2022-04-30', 'Node.js 20 LTS', 'Node.js 12 n''est plus supporté', 'system'),
('nodejs', '14.*', '20.11.0', true, '2023-04-30', '2023-04-30', 'Node.js 20 LTS', 'Node.js 14 n''est plus supporté', 'system'),
('nodejs', '16.*', '20.11.0', true, '2023-09-11', '2024-09-11', 'Node.js 20 LTS', 'Node.js 16 LTS fin de vie en septembre 2024', 'system'),
('nodejs', '18.*', '20.11.0', false, '2025-04-30', null, 'Node.js 20 LTS', 'Node.js 18 LTS supporté jusqu''en avril 2025', 'system'),

-- Python
('python', '2.7.*', '3.12.0', true, '2020-01-01', '2020-01-01', 'Python 3.12', 'Python 2.7 n''est plus supporté depuis 2020', 'system'),
('python', '3.6.*', '3.12.0', true, '2021-12-23', '2021-12-23', 'Python 3.12', 'Python 3.6 n''est plus supporté', 'system'),
('python', '3.7.*', '3.12.0', true, '2023-06-27', '2023-06-27', 'Python 3.12', 'Python 3.7 n''est plus supporté', 'system'),
('python', '3.8.*', '3.12.0', false, '2024-10-31', null, 'Python 3.12', 'Python 3.8 support de sécurité jusqu''en octobre 2024', 'system'),

-- Windows
('windows', '7.*', '11', true, '2015-01-13', '2020-01-14', 'Windows 11', 'Windows 7 n''est plus supporté depuis 2020', 'system'),
('windows', '8.*', '11', true, '2016-01-12', '2023-01-10', 'Windows 11', 'Windows 8 n''est plus supporté', 'system'),
('windows', '10.*', '11', false, '2025-10-14', null, 'Windows 11', 'Windows 10 support jusqu''en octobre 2025', 'system'),

-- Linux distributions
('ubuntu', '18.04', '24.04', false, '2023-05-31', '2028-04-30', 'Ubuntu 24.04 LTS', 'Ubuntu 18.04 LTS en support étendu jusqu''en 2028', 'system'),
('ubuntu', '20.04', '24.04', false, '2025-04-30', '2030-04-30', 'Ubuntu 24.04 LTS', 'Ubuntu 20.04 LTS supporté jusqu''en 2030', 'system'),
('ubuntu', '22.04', '24.04', false, '2027-04-30', '2032-04-30', 'Ubuntu 24.04 LTS', 'Ubuntu 22.04 LTS supporté jusqu''en 2032', 'system'),

-- Apache
('httpd', '2.2.*', '2.4.58', true, '2017-07-11', '2017-07-11', 'Apache 2.4.x', 'Apache 2.2 n''est plus supporté depuis 2017', 'system'),
('httpd', '2.4.*', '2.4.58', false, null, null, 'Dernière version stable', 'Apache 2.4 est la version stable actuelle', 'system');

COMMENT ON TABLE technology_obsolescence IS 'Table pour gérer l''obsolescence des technologies et recommander les mises à jour';
COMMENT ON COLUMN technology_obsolescence.technology_name IS 'Nom de la technologie (package, framework, OS)';
COMMENT ON COLUMN technology_obsolescence.version_pattern IS 'Pattern de version concerné (ex: 1.x, 2.*, null=toutes)';
COMMENT ON COLUMN technology_obsolescence.latest_version IS 'Dernière version stable disponible';
COMMENT ON COLUMN technology_obsolescence.is_obsolete IS 'Indique si la technologie est obsolète';
COMMENT ON COLUMN technology_obsolescence.end_of_support IS 'Date de fin du support officiel';
COMMENT ON COLUMN technology_obsolescence.end_of_life IS 'Date de fin de vie complète';
