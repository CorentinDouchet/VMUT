-- Mettre à jour les valeurs "Non disponible" vers NULL pour afficher "Oui" par défaut
UPDATE vulnerability_results 
SET validity_status = NULL 
WHERE validity_status = 'Non disponible';
