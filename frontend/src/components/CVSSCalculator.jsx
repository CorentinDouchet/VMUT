import CVSSv30Calculator from './CVSSv30Calculator';
import CVSSv31Calculator from './CVSSv31Calculator';
import CVSSv4Calculator from './CVSSv4Calculator';
import logger from '../utils/logger';


function CVSSCalculator({ vulnerability, onSave, onClose }) {
  // Détecter la version CVSS
  const version = vulnerability.cvssVersion;
  
  console.log('🔍 Version CVSS détectée:', version);
  
  // Router vers la bonne calculatrice
  if (version === '4.0' || version === 'v4.0' || version === 'CVSS v4.0') {
    console.log('✅ Utilisation calculatrice CVSS v4.0');
    return <CVSSv4Calculator vulnerability={vulnerability} onSave={onSave} onClose={onClose} />;
  } else if (version === '3.1' || version === 'v3.1' || version === 'CVSS v3.1') {
    console.log('✅ Utilisation calculatrice CVSS v3.1');
    return <CVSSv31Calculator vulnerability={vulnerability} onSave={onSave} onClose={onClose} />;
  } else if (version === '3.0' || version === 'v3.0' || version === 'CVSS v3.0') {
    console.log('✅ Utilisation calculatrice CVSS v3.0');
    return <CVSSv30Calculator vulnerability={vulnerability} onSave={onSave} onClose={onClose} />;
  } else if (version === '2.0' || version === 'v2.0' || version === 'CVSS v2.0') {
    // Pour v2.0, utiliser v3.1 par défaut avec un message
    console.log('⚠️ CVSS v2.0 détecté, utilisation de v3.1');
    return <CVSSv31Calculator vulnerability={vulnerability} onSave={onSave} onClose={onClose} />;
  } else {
    // Par défaut, utiliser v3.1
    console.log('⚠️ Version inconnue, utilisation de v3.1 par défaut');
    return <CVSSv31Calculator vulnerability={vulnerability} onSave={onSave} onClose={onClose} />;
  }
}

export default CVSSCalculator;