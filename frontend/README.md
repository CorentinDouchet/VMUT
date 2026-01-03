# MBDhackuity - Frontend

Application de gestion des vulnérabilités et de conformité CVE, développée avec React + Vite.

## 📋 Fonctionnalités

### 🎯 Tableau de Bord
Page d'accueil présentant une vue d'ensemble des statistiques de sécurité avec des graphiques professionnels (Recharts) :
- Distribution des vulnérabilités par sévérité (graphique en donut)
- Tendances mensuelles des CVE détectées (graphique en aires)
- Répartition par version CVSS (graphique en barres)

### 🔍 Scans & Vulnérabilités
- **Scans** : Import et analyse de fichiers de scan (Cyberwatch, Nessus, etc.)
- **Vulnérabilités** : Liste complète des CVE détectées avec filtres et recherche
- **Encyclopédie CVE** : Base de données exhaustive des CVE avec détails CVSS
- **Historique** : Suivi des justifications et modifications des CVE

### 🛠️ Actions Correctives
Page dédiée à la gestion proactive des mises à jour et correctifs de sécurité.

**Fonctionnement** :
- Analyse automatique des packages/dépendances installés dans le système
- Identification des versions disponibles pour chaque technologie
- Suggestion de mises à jour avec impact sur les CVE
- Affichage du nombre de CVE corrigées par chaque mise à jour

**Colonnes affichées** :
- Type (Library/System)
- Technologie (nom du package)
- Version actuelle
- Version disponible
- Criticité (basée sur les CVE associées)
- Nombre de CVE corrigées
- Impact (nombre de CVE résolues)
- Statut de disponibilité de la mise à jour
- Actions (détails et informations)

**Filtres** :
- Recherche par nom de technologie ou version
- Filtrage par catégorie (Toutes/Libraries/System)
- Filtrage par criticité (Critique/Élevée/Moyenne)

### 📜 Règles de Conformité
Page de gestion et suivi des règles de conformité aux standards de sécurité.

**Fonctionnement** :
- Gestion des règles de conformité issues des frameworks de sécurité (CIS, NIST, ISO 27001, PCI-DSS, GDPR)
- Suivi de l'état de conformité de chaque règle
- Identification des assets affectés par chaque règle
- Suivi des dernières vérifications et remédiation

**Colonnes affichées** :
- Référence (identifiant unique de la règle)
- Nom et description de la règle
- Framework (CIS, NIST, ISO, PCI-DSS, GDPR)
- Niveau de criticité
- Statut (Conforme/Non conforme/À vérifier/En cours)
- Assets affectés (nombre de systèmes concernés)
- Dernière vérification
- Actions (détails et remédiation)

**Filtres** :
- Recherche par référence, nom ou description
- Filtrage par framework de conformité
- Filtrage par statut de conformité
- Filtrage par niveau de criticité

**Statistiques affichées** :
- Total de règles configurées
- Taux de conformité global (%)
- Règles non conformes nécessitant une action
- Assets affectés nécessitant une mise en conformité

### 📚 Défauts de Sécurité
Encyclopédie des défauts de sécurité regroupant toutes les vulnérabilités par CVE unique.

**Fonctionnement** :
- Groupement automatique des vulnérabilités par CVE-ID
- Agrégation du nombre d'assets affectés par défaut
- Calcul de la sévérité basée sur le score CVSS
- Affichage du statut du défaut (Actif/Corrigé/Non corrigé)

**Colonnes affichées** :
- Référence (CVE-ID unique)
- Nom du défaut (description courte)
- Sévérité (CRITIQUE/ÉLEVÉE/MOYENNE/FAIBLE)
- Actifs (nombre de systèmes affectés)
- Mis à jour le (date de dernière modification)
- Actions (détails et informations)

**Filtres** :
- Recherche par référence CVE ou nom
- Filtrage par sévérité (Critique/Élevée/Moyenne/Faible)
- Filtrage par statut (Active/Corrigée/Ne sera pas corrigée)

**Badges de sévérité** :
- Badge rouge pour CRITIQUE (CVSS ≥ 9.0)
- Badge orange pour ÉLEVÉE (CVSS ≥ 7.0)
- Badge jaune pour MOYENNE (CVSS ≥ 4.0)
- Badge vert pour FAIBLE (CVSS < 4.0)

## 🚀 Installation

```bash
npm install
npm run dev
```

## 🛠️ Technologies

- **React 18** avec React Router pour la navigation
- **Recharts** pour les graphiques professionnels
- **Vite** pour le build et le développement
- **CSS moderne** avec variables CSS et responsive design


