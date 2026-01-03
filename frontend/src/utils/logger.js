// Logger utilitaire avec niveaux de log conditionnels
// Permet de désactiver les logs en production

const isDevelopment = import.meta.env.DEV;

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    console.warn(...args); // Warnings toujours affichés
  },
  
  error: (...args) => {
    console.error(...args); // Erreurs toujours affichées
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

export default logger;
