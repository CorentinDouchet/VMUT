import React, { useState, useEffect } from 'react';
import groupService from '../services/groupService';
import userService from '../services/userService';
import assetService from '../services/assetService';
import { RoleBasedAccess } from './RoleBasedAccess';
import '../styles/GroupManagement.css';

/**
 * Interface d'administration des groupes d'assets (STB_REQ_0101)
 * Réservé aux ADMINISTRATEUR et MAINTENANCE
 */
const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plmContainer: ''
  });

  useEffect(() => {
    loadGroups();
    loadUsers();
    loadAssets();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await groupService.getAll();
      setGroups(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des groupes:', err);
      setError('Impossible de charger les groupes');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    }
  };

  const loadAssets = async () => {
    try {
      const data = await assetService.getAll();
      setAssets(data);
    } catch (err) {
      console.error('Erreur lors du chargement des assets:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupService.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', plmContainer: '' });
      loadGroups();
    } catch (err) {
      console.error('Erreur lors de la création du groupe:', err);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible de créer le groupe'));
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupService.update(currentGroup.id, formData);
      setShowEditModal(false);
      setCurrentGroup(null);
      setFormData({ name: '', description: '', plmContainer: '' });
      loadGroups();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du groupe:', err);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible de mettre à jour le groupe'));
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (groupName === 'Non classé') {
      alert('Le groupe "Non classé" ne peut pas être supprimé');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${groupName}" ?`)) {
      return;
    }

    try {
      await groupService.delete(groupId);
      loadGroups();
    } catch (err) {
      console.error('Erreur lors de la suppression du groupe:', err);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible de supprimer le groupe'));
    }
  };

  const openEditModal = (group) => {
    setCurrentGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      plmContainer: group.plmContainer || ''
    });
    setShowEditModal(true);
  };

  const openUsersModal = (group) => {
    setCurrentGroup(group);
    setShowUsersModal(true);
  };

  const openAssetsModal = (group) => {
    setCurrentGroup(group);
    setShowAssetsModal(true);
  };

  const handleAddUserToGroup = async (userId) => {
    try {
      await groupService.addUser(currentGroup.id, userId);
      loadGroups();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible d\'ajouter l\'utilisateur'));
    }
  };

  const handleRemoveUserFromGroup = async (userId) => {
    try {
      await groupService.removeUser(currentGroup.id, userId);
      loadGroups();
    } catch (err) {
      console.error('Erreur lors du retrait de l\'utilisateur:', err);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible de retirer l\'utilisateur'));
    }
  };

  const handleAddAssetToGroup = async (assetId) => {
    try {
      await groupService.assignAsset(currentGroup.id, assetId);
      loadGroups();
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'asset:', err);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible d\'ajouter l\'asset'));
    }
  };

  const handleRemoveAssetFromGroup = async (assetId) => {
    try {
      await groupService.removeAsset(currentGroup.id, assetId);
      loadGroups();
    } catch (err) {
      console.error('Erreur lors du retrait de l\'asset:', err);
      alert('Erreur: ' + (err.response?.data?.message || 'Impossible de retirer l\'asset'));
    }
  };

  const isUserInGroup = (userId) => {
    return currentGroup?.users?.some(u => u.id === userId);
  };

  const isAssetInGroup = (assetId) => {
    return currentGroup?.assets?.some(a => a.id === assetId);
  };

  if (loading) {
    return <div className="loading">Chargement des groupes...</div>;
  }

  return (
    <RoleBasedAccess allowedRoles={['ADMINISTRATEUR', 'MAINTENANCE']}>
      <div className="p-6">
        <div className="page-header">
          <h1>Gestion des Groupes d'Assets</h1>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Créer un Groupe
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="groups-grid">
          {groups.map(group => (
            <div key={group.id} className="group-card">
              <div className="group-header">
                <h3>{group.name}</h3>
                {group.name !== 'Non classé' && (
                  <div className="group-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => openEditModal(group)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <p className="group-description">{group.description || 'Aucune description'}</p>
              
              {group.plmContainer && (
                <div className="group-plm">
                  <strong>PLM:</strong> {group.plmContainer}
                </div>
              )}

              <div className="group-stats">
                <div className="stat">
                  <span className="stat-value">{group.assetCount}</span>
                  <span className="stat-label">Assets</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{group.userCount}</span>
                  <span className="stat-label">Utilisateurs</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{group.vulnerabilityCount}</span>
                  <span className="stat-label">CVE</span>
                </div>
              </div>

              <button 
                className="btn-secondary btn-full-width"
                onClick={() => openUsersModal(group)}
              >
                👥 Gérer les Utilisateurs
              </button>

              <button 
                className="btn-secondary btn-full-width"
                style={{ marginTop: '8px' }}
                onClick={() => openAssetsModal(group)}
              >
                🖥️ Gérer les Assets
              </button>
            </div>
          ))}
        </div>

        {/* Modal Création */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Créer un Groupe</h2>
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom du groupe"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du groupe"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Conteneur PLM</label>
                  <input
                    type="text"
                    value={formData.plmContainer}
                    onChange={e => setFormData({ ...formData, plmContainer: e.target.value })}
                    placeholder="Référence PLM (projet, domaine)"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Édition */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2>Modifier le Groupe</h2>
              <form onSubmit={handleUpdateGroup}>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={currentGroup?.name === 'Non classé'}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>Conteneur PLM</label>
                  <input
                    type="text"
                    value={formData.plmContainer}
                    onChange={e => setFormData({ ...formData, plmContainer: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Gestion Utilisateurs */}
        {showUsersModal && currentGroup && (
          <div className="modal-overlay" onClick={() => setShowUsersModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <h2>Utilisateurs du Groupe: {currentGroup.name}</h2>
              
              <div className="users-list">
                {users.map(user => {
                  const inGroup = isUserInGroup(user.id);
                  return (
                    <div key={user.id} className="user-item">
                      <div className="user-info">
                        <strong>{user.username}</strong>
                        <span className="user-role">{user.role}</span>
                      </div>
                      <button
                        className={inGroup ? 'btn-danger' : 'btn-primary'}
                        onClick={() => inGroup 
                          ? handleRemoveUserFromGroup(user.id)
                          : handleAddUserToGroup(user.id)
                        }
                      >
                        {inGroup ? '➖ Retirer' : '➕ Ajouter'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowUsersModal(false)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Gestion Assets */}
        {showAssetsModal && currentGroup && (
          <div className="modal-overlay" onClick={() => setShowAssetsModal(false)}>
            <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
              <h2>Assets du Groupe: {currentGroup.name}</h2>
              
              <div className="users-list">
                {assets.map(asset => {
                  const inGroup = isAssetInGroup(asset.id);
                  return (
                    <div key={asset.id} className="user-item">
                      <div className="user-info">
                        <strong>{asset.assetName || asset.name}</strong>
                        <span className="user-role">{asset.type || 'N/A'}</span>
                      </div>
                      <button
                        className={inGroup ? 'btn-danger' : 'btn-primary'}
                        onClick={() => inGroup 
                          ? handleRemoveAssetFromGroup(asset.id)
                          : handleAddAssetToGroup(asset.id)
                        }
                      >
                        {inGroup ? '➖ Retirer' : '➕ Ajouter'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowAssetsModal(false)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedAccess>
  );
};

export default GroupManagement;
