import { useState, useEffect } from 'react';
import cvssService from '../services/cvssService';
import vulnerabilityService from '../services/vulnerabilityService';
import historyService from '../services/historyService';
import attachmentService from '../services/attachmentService';
import FileUpload from './FileUpload';
import logger from '../utils/logger';

function CommentsModal({ vulnerability, selectedCVEs = [], bulkMode = false, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  
  // États pour les pièces jointes
  const [attachments, setAttachments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    console.log('📥 Modal ouvert:', { bulkMode, selectedCVEs: selectedCVEs.length, vuln: vulnerability });
    
    // En mode bulk, on ne charge pas les commentaires existants
    if (!bulkMode) {
      loadComments();
      loadAttachments();
    }
  }, [vulnerability, bulkMode]);

  const loadComments = () => {
    // Ne charger que si pas en mode bulk
    if (bulkMode) return;
    
    try {
      const existingComments = vulnerability.comments ? 
        (typeof vulnerability.comments === 'string' ? 
          JSON.parse(vulnerability.comments) : 
          vulnerability.comments) : [];
      
      setComments(Array.isArray(existingComments) ? existingComments : []);
    } catch (err) {
      console.error('❌ Erreur parsing commentaires:', err);
      setComments([]);
    }
  };

  const loadAttachments = async () => {
    if (bulkMode || !vulnerability?.id) return;
    
    try {
      const data = await attachmentService.getAttachments(vulnerability.id);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Erreur chargement pièces jointes:', err);
      setAttachments([]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('⚠️ Veuillez sélectionner un fichier');
      return;
    }

    setUploadingFile(true);
    try {
      await attachmentService.uploadAttachment(
        vulnerability.id,
        selectedFile,
        author || 'Utilisateur',
        uploadDescription
      );
      
      alert('✅ Fichier uploadé avec succès !');
      setSelectedFile(null);
      setUploadDescription('');
      await loadAttachments();
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      alert(`❌ Erreur: ${error.message || 'Échec de l\'upload'}`);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const blob = await attachmentService.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      alert('❌ Erreur lors du téléchargement');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Supprimer cette pièce jointe ?')) return;
    
    try {
      await attachmentService.deleteAttachment(attachmentId);
      alert('✅ Pièce jointe supprimée');
      await loadAttachments();
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('⚠️ Veuillez saisir un commentaire');
      return;
    }

    setLoading(true);
    try {
      // ✅ MODE BULK
      if (bulkMode && selectedCVEs.length > 0) {
        console.log('📤 Envoi commentaire bulk:', { ids: selectedCVEs });
        
        const result = await cvssService.bulkComment({
          ids: selectedCVEs,
          comment: newComment,
          author: author || 'Utilisateur',
          role: 'analyst' // Kept for backend compatibility but not used
        });

        console.log('✅ Résultat bulk:', result);
        
        alert(`✅ Commentaire ajouté à ${result.updated} CVE !`);
        
        // Vérifier chaque CVE pour l'historique
        for (const id of selectedCVEs) {
          await addToHistory(id);
        }
        
        onClose();
        return;
      }

      // ✅ MODE NORMAL
      console.log('📤 Envoi commentaire normal:', { id: vulnerability.id });
      
      await cvssService.addComment(vulnerability.id, {
        comment: newComment,
        author: author || 'Utilisateur',
        role: 'analyst' // Kept for backend compatibility but not used
      });

      const newCommentObj = {
        id: Date.now(),
        text: newComment,
        author: author || 'Utilisateur',
        timestamp: new Date().toISOString()
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
      setAuthor('');
      
      alert('✅ Commentaire ajouté avec succès !');
      
      // Ajouter à l'historique si le commentaire est ajouté
      if (comments.length >= 0) {
        await addToHistory(vulnerability.id);
      }
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = async (vulnId) => {
    try {
      console.log('🔄 Tentative ajout historique pour CVE ID:', vulnId);
      
      // Récupérer les détails complets de la vulnérabilité
      const vuln = await vulnerabilityService.getById(vulnId);
      console.log('📦 Vulnérabilité récupérée:', vuln);
      
      // Parser les commentaires
      let existingComments = [];
      
      try {
        existingComments = vuln.comments ? 
          (typeof vuln.comments === 'string' ? 
            JSON.parse(vuln.comments) : vuln.comments) : [];
      } catch (e) {
        console.error('Erreur parsing commentaires:', e);
      }
      
      const hasComments = Array.isArray(existingComments) && existingComments.length > 0;
      
      console.log('📊 Statut commentaires:', { hasComments });
      
      // Vérifier qu'il y a des commentaires
      if (!hasComments) {
        console.log('⚠️ Pas de commentaires, ne pas ajouter à l\'historique');
        return;
      }
      
      console.log('✅ Commentaires présents, ajout à l\'historique...');
      
      // Préparer les données pour l'historique
      const historyData = {
        cveId: vuln.cveId,
        packageName: vuln.packageName,
        packageVersion: vuln.packageVersion,
        cveDescription: vuln.cveDescription || vuln.description,
        baseScore: vuln.baseScore,
        baseSeverity: vuln.baseSeverity,
        versionCvss: vuln.cvssVersion,
        technologiesAffectees: vuln.affectedTechnologies || vuln.technologies_affectees,
        cpeCriteria: vuln.cpeCriteria || {},
        cwe: vuln.cwe,
        exploitPoc: vuln.exploitPocAvailable || vuln.exploit_poc,
        exploitReferences: vuln.exploitReferences || vuln.exploit_references,
        commentsAnalyst: existingComments, // Reusing for compatibility
        commentsValidator: [],
        scanName: vuln.scanName,
        vectorString: vuln.vectorString || vuln.vecteur,
        publishedDate: vuln.publishedDate,
        lastModifiedDate: vuln.lastModifiedDate
      };
      
      console.log('📤 Envoi données à l\'historique:', historyData);
      
      // Ajouter à l'historique
      const result = await historyService.addCve(historyData);
      
      if (result.existing) {
        console.log('ℹ️ CVE déjà dans l\'historique');
      } else {
        console.log('✅ CVE ajoutée à l\'historique avec succès');
      }
      
    } catch (error) {
      console.error('❌ Erreur ajout historique:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    
    setLoading(true);
    try {
      await cvssService.deleteComment(vulnerability.id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      alert('✅ Commentaire supprimé');
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {bulkMode 
              ? `💬 Ajouter un commentaire à ${selectedCVEs.length} CVE`
              : `💬 Commentaires - ${vulnerability?.cveId || 'CVE'}`
            }
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Section historique des commentaires (mode normal uniquement) */}
          {!bulkMode && comments.length > 0 && (
            <div className="comments-history">
              <h3>📝 Historique</h3>
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">
                      👤 {comment.author}
                    </span>
                    <span className="comment-date">
                      {new Date(comment.timestamp).toLocaleString('fr-FR')}
                    </span>
                    <button 
                      className="btn-delete-comment"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Section ajout commentaire */}
          <div className="comment-form">
            <h3>✍️ Nouveau commentaire</h3>
            <input
              type="text"
              placeholder="Auteur (optionnel)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="input-author"
            />
            <textarea
              placeholder="Votre commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="input-comment"
            />
            <button 
              className="btn-submit"
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
            >
              {loading ? '⏳ Ajout...' : '✅ Ajouter'}
            </button>
          </div>

          {/* Section pièces jointes (mode normal uniquement) */}
          {!bulkMode && (
            <div className="attachments-section mt-6">
              <h3 className="text-lg font-semibold mb-3">📎 Pièces jointes</h3>
              
              {/* Liste des pièces jointes existantes */}
              {attachments.length > 0 && (
                <div className="mb-4 space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{att.filename}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(att.uploadDate).toLocaleDateString('fr-FR')} • {att.uploadedBy}
                            {att.description && ` • ${att.description}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(att)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          ⬇️ Télécharger
                        </button>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone d'upload */}
              <div className="space-y-3">
                <FileUpload onFileSelect={setSelectedFile} />
                
                {selectedFile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-blue-900">
                          📄 {selectedFile.name}
                        </div>
                        <div className="text-xs text-blue-700">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      placeholder="Description (optionnel)"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <button
                      onClick={handleFileUpload}
                      disabled={uploadingFile}
                      className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadingFile ? '⏳ Upload en cours...' : '📤 Uploader'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default CommentsModal;
