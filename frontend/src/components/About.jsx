import { useState } from 'react';

function About() {
  const [activeTab, setActiveTab] = useState('sources');

  const tabs = [
    { id: 'sources', label: 'Sources officielles' },
    { id: 'scoring', label: 'Système de scoring'},
    { id: 'policy', label: 'Politique d\'ajustement'},
    { id: 'faq', label: 'FAQ'}
  ];

  const faqItems = [
    {
      question: "Quelle est la différence entre le score CVSS officiel et le score ajusté ?",
      answer: "Le score CVSS officiel provient de la base NVD (National Vulnerability Database) et représente la criticité intrinsèque de la vulnérabilité. Le score ajusté est un score contextualisé, calculé localement en fonction de votre environnement spécifique (exposition réseau, impact métier, mesures de protection existantes). Le score NVD n'est jamais modifié dans la base de données."
    },
    {
      question: "Comment fonctionne la corrélation automatique CVE ↔ Composant ?",
      answer: "La corrélation s'effectue via le matching des identifiants CPE (Common Platform Enumeration). Le système compare les composants détectés dans vos assets avec les CPE listés dans les CVE de la base NVD. Le matching supporte les wildcards (*), les plages de versions, et prend en compte l'OS et l'architecture du système."
    },
    {
      question: "Que faire en cas de doublon CVE détecté par plusieurs outils ?",
      answer: "Lorsque plusieurs scanners détectent la même vulnérabilité, l'outil affiche une ligne distincte par source en mode 'Détail technique', mais centralise la justification sur une unique entrée par couple [CVE – Asset]. En mode 'Consolidé', les détections multiples sont regroupées automatiquement."
    },
    {
      question: "Comment réutiliser une justification sur une nouvelle version d'asset ?",
      answer: "Lors de la duplication d'un asset, vous pouvez choisir de copier les justifications existantes. Le système propose également une fonctionnalité de suggestion de justifications réutilisables basée sur les CVE communes entre différents assets ou versions."
    },
    {
      question: "Que signifie le marquage 'Obsolète' sur un composant ?",
      answer: "Un composant marqué comme obsolète indique que sa version n'est plus maintenue par son éditeur (fin de support). Cette information est saisie manuellement ou importée via un référentiel. Les composants obsolètes nécessitent une attention particulière car ils ne recevront plus de correctifs de sécurité."
    },
    {
      question: "Comment fonctionnent les groupes d'assets ?",
      answer: "Les groupes permettent de cloisonner les assets par projet, domaine métier ou périmètre. Chaque utilisateur ne peut accéder qu'aux données des groupes auxquels il est rattaché. Cela garantit la confidentialité et facilite la gestion des droits d'accès."
    },
    {
      question: "Quels formats de fichiers sont acceptés pour l'import ?",
      answer: "L'outil accepte plusieurs formats : OpenVAS/Greenbone (XML, CSV), Cyberwatch (JSON, TXT), scripts internes (JSON, CSV), et fichiers pivot (CSV, XLSX). Chaque format doit contenir au minimum les métadonnées système (nom machine, OS, version) et la liste des composants détectés."
    },
    {
      question: "Comment sont journalisées les actions dans l'outil ?",
      answer: "Toutes les actions critiques sont tracées avec l'identifiant utilisateur, la date/heure, le type d'action, et les détails associés. Cela inclut : imports de fichiers, création/modification d'assets, ajout de justifications, ajustements CVSS, modifications de statuts, et gestions des groupes/utilisateurs."
    }
  ];

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">À propos de VMUT</h1>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* Onglet Sources officielles */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                  Sources officielles utilisées
                </h2>
                <p className="text-slate-600 mb-6">
                  VMUT s'appuie sur des sources de données officielles et reconnues internationalement pour garantir 
                  la fiabilité et l'exactitude des informations de sécurité.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Base CVE */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Base CVE</h3>
                      <p className="text-sm text-slate-700 mb-3">
                        <strong>Source :</strong> National Vulnerability Database (NVD)
                      </p>
                      <a 
                        href="https://nvd.nist.gov" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        https://nvd.nist.gov
                        <span>↗</span>
                      </a>
                      <p className="text-sm text-slate-600 mt-3">
                        Base de données maintenue par le NIST (National Institute of Standards and Technology) 
                        contenant l'ensemble des vulnérabilités CVE (Common Vulnerabilities and Exposures) connues.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Référentiel CPE */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Référentiel CPE</h3>
                      <p className="text-sm text-slate-700 mb-3">
                        <strong>Source :</strong> CPE Dictionary (NVD)
                      </p>
                      <a 
                        href="https://nvd.nist.gov/products/cpe" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        https://nvd.nist.gov/products/cpe
                        <span>↗</span>
                      </a>
                      <p className="text-sm text-slate-600 mt-3">
                        Dictionnaire CPE (Common Platform Enumeration) permettant l'identification standardisée 
                        des produits logiciels et matériels pour la corrélation avec les vulnérabilités.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Classification CWE */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Classification CWE</h3>
                      <p className="text-sm text-slate-700 mb-3">
                        <strong>Source :</strong> Common Weakness Enumeration
                      </p>
                      <a 
                        href="https://cwe.mitre.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        https://cwe.mitre.org
                        <span>↗</span>
                      </a>
                      <p className="text-sm text-slate-600 mt-3">
                        Système de classification des faiblesses logicielles maintenu par MITRE, 
                        utilisé pour catégoriser les types de vulnérabilités.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scoring CVSS */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Spécifications CVSS</h3>
                      <p className="text-sm text-slate-700 mb-3">
                        <strong>Source :</strong> FIRST (Forum of Incident Response and Security Teams)
                      </p>
                      <a 
                        href="https://www.first.org/cvss" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        https://www.first.org/cvss
                        <span>↗</span>
                      </a>
                      <p className="text-sm text-slate-600 mt-3">
                        Documentation officielle du système Common Vulnerability Scoring System (CVSS) 
                        pour l'évaluation de la sévérité des vulnérabilités.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Système de scoring */}
          {activeTab === 'scoring' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                  Version du système de scoring utilisée
                </h2>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">CVSS (Common Vulnerability Scoring System)</h3>
                <p className="text-slate-700 mb-4">
                  VMUT supporte <strong>trois versions du système CVSS</strong> pour assurer la compatibilité 
                  avec l'ensemble des CVE de la base NVD :
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800">CVSS v3.1</h4>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">RECOMMANDÉ</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Version actuellement privilégiée par la NVD. Utilisée par défaut pour les nouvelles CVE depuis 2019.
                      Inclut 8 métriques de base + métriques temporelles et environnementales.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800">CVSS v3.0</h4>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">SUPPORTÉ</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Version antérieure encore présente dans la base NVD pour les CVE historiques.
                      Compatibilité maintenue pour assurer la rétrocompatibilité.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800">CVSS v4.0</h4>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">EXPÉRIMENTAL</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      Dernière version publiée par FIRST. Support intégré pour anticiper l'adoption progressive 
                      par la communauté. Inclut des métriques supplémentaires pour une évaluation plus fine.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="text-center mb-3">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🔴</span>
                    </div>
                    <h4 className="font-bold text-red-600">CRITICAL</h4>
                    <p className="text-2xl font-bold text-slate-800 mt-1">9.0 - 10.0</p>
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    Vulnérabilités critiques nécessitant une action immédiate
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="text-center mb-3">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🟠</span>
                    </div>
                    <h4 className="font-bold text-orange-600">HIGH</h4>
                    <p className="text-2xl font-bold text-slate-800 mt-1">7.0 - 8.9</p>
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    Vulnérabilités importantes à traiter prioritairement
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="text-center mb-3">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🟡</span>
                    </div>
                    <h4 className="font-bold text-yellow-600">MEDIUM</h4>
                    <p className="text-2xl font-bold text-slate-800 mt-1">4.0 - 6.9</p>
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    Vulnérabilités à traiter selon le contexte
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span>📐</span>
                  Composantes du score CVSS
                </h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-slate-700 mb-2">Métriques de base</p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• Vecteur d'attaque (AV)</li>
                      <li>• Complexité (AC)</li>
                      <li>• Privilèges requis (PR)</li>
                      <li>• Interaction utilisateur (UI)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 mb-2">Métriques d'impact</p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• Confidentialité (C)</li>
                      <li>• Intégrité (I)</li>
                      <li>• Disponibilité (A)</li>
                      <li>• Portée (S)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 mb-2">Métriques environnementales</p>
                    <ul className="space-y-1 text-slate-600">
                      <li>• Exigences de sécurité</li>
                      <li>• Métriques modifiées</li>
                      <li>• Contexte d'exploitation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Politique d'ajustement */}
          {activeTab === 'policy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                  Politique d'ajustement des scores
                </h2>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">1️⃣</span>
                    Score CVSS de base (NVD)
                  </h3>
                  <p className="text-slate-700 mb-3">
                    Le score CVSS officiel provenant de la NVD reflète la criticité <strong>intrinsèque</strong> de 
                    la vulnérabilité, indépendamment de tout contexte spécifique. Il est calculé par les analystes 
                    de la NVD selon les métriques standardisées CVSS.
                  </p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                      <strong>Exemple :</strong> Une vulnérabilité de type "Buffer Overflow" permettant l'exécution 
                      de code à distance avec authentification aura un score de base élevé (ex: 8.1 HIGH), car elle 
                      représente un risque significatif dans un contexte général.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">2️⃣</span>
                    Score CVSS ajusté (contextualisé)
                  </h3>
                  <p className="text-slate-700 mb-3">
                    Le score ajusté prend en compte le <strong>contexte opérationnel</strong> spécifique à votre 
                    environnement. Il est calculé localement par les utilisateurs habilités (rôle AUTEUR) en 
                    appliquant les métriques environnementales du CVSS.
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <p className="text-sm font-semibold text-blue-800 mb-2">Facteurs de réduction du score :</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Service non exposé sur le réseau (vecteur d'attaque local uniquement)</li>
                        <li>• Système isolé sans connexion externe</li>
                        <li>• Mesures de protection compensatoires en place (pare-feu, WAF, IPS)</li>
                        <li>• Composant non utilisé ou désactivé dans la configuration</li>
                        <li>• Authentification forte requise pour exploiter la faille</li>
                      </ul>
                    </div>

                    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                      <p className="text-sm font-semibold text-orange-800 mb-2">Facteurs d'augmentation du score :</p>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Système critique pour l'activité (haute exigence de disponibilité)</li>
                        <li>• Exposition directe à Internet sans protection</li>
                        <li>• Données sensibles ou réglementées traitées</li>
                        <li>• Infrastructure sans redondance</li>
                        <li>• Environnement de production avec fort impact métier</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600">
                      <strong>Exemple :</strong> La même vulnérabilité (score NVD 8.1) sur un serveur isolé du réseau 
                      avec authentification forte pourrait voir son score ajusté à 5.2 (MEDIUM), tandis que sur un 
                      système critique exposé à Internet, il pourrait être maintenu voire augmenté à 9.0 (CRITICAL).
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">3️⃣</span>
                    Traçabilité des ajustements
                  </h3>
                  <p className="text-slate-700 mb-3">
                    Chaque ajustement de score est <strong>entièrement tracé</strong> dans l'historique avec :
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 mb-2">Métadonnées enregistrées :</p>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>✓ Identifiant de l'auteur</li>
                        <li>✓ Date et heure de modification</li>
                        <li>✓ Score avant/après</li>
                        <li>✓ Vecteur CVSS utilisé</li>
                      </ul>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="font-semibold text-slate-700 mb-2">Contexte documenté :</p>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>✓ Justification textuelle</li>
                        <li>✓ Pièces jointes (PDF, captures)</li>
                        <li>✓ Statut métier associé</li>
                        <li>✓ Asset et vulnérabilité concernés</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                  Questions fréquemment posées
                </h2>
                <p className="text-slate-600">
                  Retrouvez ici les réponses aux questions les plus courantes sur l'utilisation de VMUT.
                </p>
              </div>

              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <details 
                    key={index}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <span className="text-blue-500">❯</span>
                        {item.question}
                      </span>
                    </summary>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                      <p className="text-slate-700 leading-relaxed">{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default About;
