function Statistics() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-item">🏠 Accueil</span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-item">Statistiques</span>
      </div>

      {/* Header */}
      <div className="content-header">
        <div className="page-title-section">
          <div>
            <h1 className="page-title">📊 Statistiques & Analyses</h1>
            <p className="page-subtitle">
              Tableaux de bord et indicateurs de sécurité
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="content-placeholder">
        <div className="placeholder-icon">📊</div>
        <h2>Statistiques & Analyses</h2>
        <p>Cette page affichera des graphiques et analyses détaillées.</p>
        <ul className="feature-list">
          <li>✅ Évolution des vulnérabilités</li>
          <li>✅ Distribution par sévérité</li>
          <li>✅ Temps de résolution moyen</li>
          <li>✅ Tendances et prédictions</li>
        </ul>
      </div>
    </div>
  );
}

export default Statistics;