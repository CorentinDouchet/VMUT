import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Composant de sélection de groupe d'assets
 * Réutilisable dans différentes interfaces
 */
const GroupSelector = ({ 
  value, 
  onChange, 
  placeholder = "Sélectionner un groupe",
  includeAll = false,
  disabled = false,
  className = ""
}) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/groups');
      setGroups(response);
    } catch (err) {
      console.error('Erreur lors du chargement des groupes:', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const selectedGroup = groups.find(g => g.id === parseInt(selectedValue));
    
    if (onChange) {
      onChange(selectedValue === '' ? null : parseInt(selectedValue), selectedGroup);
    }
  };

  return (
    <select 
      className={`w-full px-3 py-2.5 border border-slate-300 rounded-md text-sm bg-white cursor-pointer transition-all focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400 hover:not-disabled:border-blue-400 ${className}`}
      value={value || ''}
      onChange={handleChange}
      disabled={disabled || loading}
    >
      {loading ? (
        <option value="">Chargement...</option>
      ) : (
        <>
          <option value="">{placeholder}</option>
          {includeAll && <option value="all">Tous les groupes</option>}
          {groups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name} ({group.assetCount} assets)
            </option>
          ))}
        </>
      )}
    </select>
  );
};

export default GroupSelector;
