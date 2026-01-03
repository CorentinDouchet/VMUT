import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [stats, setStats] = useState(null);

    const { user: currentUser } = useAuth();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'CONSULTANT',
        firstName: '',
        lastName: '',
        enabled: true
    });

    useEffect(() => {
        loadUsers();
        loadStats();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await userService.getAll();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement des utilisateurs');
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const data = await userService.getStats();
            setStats(data);
        } catch (err) {
            console.error('Erreur lors du chargement des statistiques:', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await userService.create(formData);
            
            // Si un mot de passe a été généré automatiquement, l'afficher
            if (response.generatedPassword) {
                alert(
                    `✅ Utilisateur créé avec succès !\n\n` +
                    `🔑 Mot de passe généré automatiquement :\n` +
                    `${response.generatedPassword}\n\n` +
                    `⚠️ IMPORTANT : Communiquez ce mot de passe à l'utilisateur.\n` +
                    `Il ne sera plus jamais affiché.`
                );
            } else {
                alert('Utilisateur créé avec succès');
            }
            
            setShowCreateModal(false);
            resetForm();
            loadUsers();
            loadStats();
        } catch (err) {
            alert(err.response?.data || 'Erreur lors de la création');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updateData = { ...formData };
            delete updateData.username; // On ne peut pas changer le username
            if (!updateData.password) {
                delete updateData.password; // Ne pas envoyer de mot de passe vide
            }
            
            await userService.update(editingUser.id, updateData);
            alert('Utilisateur modifié avec succès');
            setEditingUser(null);
            resetForm();
            loadUsers();
        } catch (err) {
            alert(err.response?.data || 'Erreur lors de la modification');
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await userService.toggleStatus(userId);
            loadUsers();
            loadStats();
        } catch (err) {
            alert('Erreur lors du changement de statut');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            return;
        }
        try {
            await userService.delete(userId);
            alert('Utilisateur supprimé');
            loadUsers();
            loadStats();
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            role: 'CONSULTANT',
            firstName: '',
            lastName: '',
            enabled: true
        });
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            enabled: user.enabled
        });
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRole = !filterRole || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const getRoleBadgeClass = (role) => {
        const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
        switch (role) {
            case 'MAINTENANCE': return `${baseClasses} bg-purple-100 text-purple-800 border border-purple-200`;
            case 'ADMINISTRATEUR': return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
            case 'AUTEUR': return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
            case 'CONSULTANT': return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
            default: return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'MAINTENANCE': return 'Maintenance';
            case 'ADMINISTRATEUR': return 'Administrateur';
            case 'AUTEUR': return 'Auteur';
            case 'CONSULTANT': return 'Consultant';
            default: return role;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64 text-slate-500">Chargement...</div>;
    if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">{error}</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Gestion des utilisateurs</h1>
                <button 
                    onClick={() => setShowCreateModal(true)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                    + Créer un utilisateur
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total</h3>
                        <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Consultants</h3>
                        <p className="text-2xl font-bold text-slate-900">{stats.consultants}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Auteurs</h3>
                        <p className="text-2xl font-bold text-slate-900">{stats.auteurs}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Administrateurs</h3>
                        <p className="text-2xl font-bold text-slate-900">{stats.administrateurs}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Actifs</h3>
                        <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Inactifs</h3>
                        <p className="text-2xl font-bold text-slate-400">{stats.inactifs}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Rechercher par nom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <select 
                    value={filterRole} 
                    onChange={(e) => setFilterRole(e.target.value)} 
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                >
                    <option value="">Tous les rôles</option>
                    <option value="CONSULTANT">Consultant</option>
                    <option value="AUTEUR">Auteur</option>
                    <option value="ADMINISTRATEUR">Administrateur</option>
                    <option value="MAINTENANCE">Maintenance</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rôle</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernière connexion</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <strong className="text-slate-900 font-medium">{user.username}</strong>
                                            {user.fullName && <span className="text-sm text-slate-500">{user.fullName}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={getRoleBadgeClass(user.role)}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.enabled ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                            {user.enabled ? '✓ Actif' : '✗ Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => openEditModal(user)} 
                                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors" 
                                                title="Modifier"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => handleToggleStatus(user.id)} 
                                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                                                title={user.enabled ? 'Désactiver' : 'Activer'}
                                            >
                                                {user.enabled ? '🔒' : '🔓'}
                                            </button>
                                            {currentUser?.role === 'MAINTENANCE' && (
                                                <button 
                                                    onClick={() => handleDelete(user.id)} 
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors" 
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-500">Aucun utilisateur trouvé</div>
                )}
            </div>

            {/* Modal de création */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Créer un utilisateur</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Nom d'utilisateur *</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                        required
                                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Mot de passe (optionnel - généré automatiquement si vide)</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Laissez vide pour générer automatiquement"
                                    minLength={6}
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <small className="text-xs text-slate-500">
                                    Un mot de passe robuste (16 caractères) sera généré automatiquement si ce champ est vide
                                </small>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Prénom</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Nom</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Rôle *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    required
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="CONSULTANT">Consultant (Lecture seule)</option>
                                    <option value="AUTEUR">Auteur (Import, justifications, CVSS)</option>
                                    <option value="ADMINISTRATEUR">Administrateur (Gestion utilisateurs)</option>
                                    <option value="MAINTENANCE">Maintenance (Tous les droits)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.enabled}
                                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    id="create-enabled"
                                />
                                <label htmlFor="create-enabled" className="text-sm text-slate-700 cursor-pointer">Compte activé</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => { setShowCreateModal(false); resetForm(); }} 
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de modification */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Modifier l'utilisateur</h2>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Nom d'utilisateur</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    disabled
                                    className="px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    minLength={6}
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Prénom</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-slate-700">Nom</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Rôle</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="CONSULTANT">Consultant (Lecture seule)</option>
                                    <option value="AUTEUR">Auteur (Import, justifications, CVSS)</option>
                                    <option value="ADMINISTRATEUR">Administrateur (Gestion utilisateurs)</option>
                                    <option value="MAINTENANCE">Maintenance (Tous les droits)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.enabled}
                                    onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    id="edit-enabled"
                                />
                                <label htmlFor="edit-enabled" className="text-sm text-slate-700 cursor-pointer">Compte activé</label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    type="button" 
                                    onClick={() => { setEditingUser(null); resetForm(); }} 
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
