'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { utilisateurService, User, CreateUtilisateurRequest, UserCredentials } from '@/lib/services/utilisateurService';

export default function UtilisateursPage() {
  const router = useRouter();
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [credentialsMap, setCredentialsMap] = useState<Record<number, UserCredentials>>({});
  const [loadingCredentials, setLoadingCredentials] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState<CreateUtilisateurRequest>({
    email: '',
    motDePasseHash: '',
    role: 'Agent',
    statutUtilisateur: 'Actif',
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadUtilisateurs();
  }, [router]);

  const loadUtilisateurs = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      console.log('Chargement des utilisateurs...');
      const data = await utilisateurService.getAll();
      console.log('Données reçues dans loadUtilisateurs:', data);
      console.log('Type de données:', typeof data, Array.isArray(data));
      
      // S'assurer que data est un tableau
      const utilisateursArray = Array.isArray(data) ? data : [];
      console.log(`Nombre d'utilisateurs à afficher: ${utilisateursArray.length}`);
      setUtilisateurs(utilisateursArray);
      
      // Charger les credentials pour chaque utilisateur
      loadCredentials(utilisateursArray);
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des utilisateurs');
      setUtilisateurs([]); // Réinitialiser à un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async (users: User[]) => {
    const credentials: Record<number, UserCredentials> = {};
    const loading: Record<number, boolean> = {};
    
    for (const user of users) {
      loading[user.idUtilisateur] = true;
      try {
        const creds = await utilisateurService.getCredentials(user.idUtilisateur);
        console.log(`Credentials chargés pour l'utilisateur ${user.idUtilisateur}:`, creds);
        credentials[user.idUtilisateur] = creds;
      } catch (err: any) {
        console.error(`Erreur lors du chargement des credentials pour l'utilisateur ${user.idUtilisateur}:`, err);
        console.error('Status:', err.response?.status);
        console.error('Data:', err.response?.data);
        // Si pas de credentials, créer un objet par défaut
        credentials[user.idUtilisateur] = {
          email: user.email,
          motDePasseInitial: 'Non disponible'
        };
      } finally {
        loading[user.idUtilisateur] = false;
      }
    }
    
    setCredentialsMap(credentials);
    setLoadingCredentials(loading);
  };

  const loadUserCredentials = async (userId: number) => {
    if (credentialsMap[userId]) return; // Déjà chargé
    
    setLoadingCredentials(prev => ({ ...prev, [userId]: true }));
    try {
      const creds = await utilisateurService.getCredentials(userId);
      setCredentialsMap(prev => ({ ...prev, [userId]: creds }));
    } catch (err) {
      console.error(`Erreur lors du chargement des credentials:`, err);
      setCredentialsMap(prev => ({
        ...prev,
        [userId]: {
          email: utilisateurs.find(u => u.idUtilisateur === userId)?.email || '',
          motDePasseInitial: 'Non disponible'
        }
      }));
    } finally {
      setLoadingCredentials(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await utilisateurService.create(formData);
      setShowModal(false);
      setFormData({
        email: '',
        motDePasseHash: '',
        role: 'Agent',
        statutUtilisateur: 'Actif',
      });
      loadUtilisateurs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await utilisateurService.delete(id);
      loadUtilisateurs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleUpdateStatut = async (id: number, currentStatut: 'Actif' | 'Bloqué') => {
    const newStatut = currentStatut === 'Actif' ? 'Bloqué' : 'Actif';
    const confirmMessage = newStatut === 'Bloqué' 
      ? 'Êtes-vous sûr de vouloir bloquer cet utilisateur ?'
      : 'Êtes-vous sûr de vouloir activer cet utilisateur ?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setError('');
      await utilisateurService.updateStatut(id, newStatut);
      loadUtilisateurs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du statut');
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return {
      strength: Math.min(strength, 4),
      label: labels[Math.min(strength, 4)],
      color: colors[Math.min(strength, 4)]
    };
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Le mot de passe est obligatoire';
    }
    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (password.length > 255) {
      return 'Le mot de passe ne doit pas dépasser 255 caractères';
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;

    setError('');

    // Validation du mot de passe
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ?')) {
      return;
    }

    try {
      setIsResettingPassword(true);
      setError('');
      await utilisateurService.resetPassword(editingUser.idUtilisateur, newPassword);
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setEditingUser(null);
      setShowPassword(false);
      loadUtilisateurs();
      
      // Afficher un message de succès plus élégant
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2';
      successMessage.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Mot de passe réinitialisé avec succès</span>
      `;
      document.body.appendChild(successMessage);
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
          </div>
        </div>
      </div>
    
  );
}

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <Link
              href="/utilisateurs/ajouter"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-block"
            >
              + Nouvel utilisateur
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Afficher les utilisateurs séparés par rôle */}
          {['Admin', 'Agent', 'Caisse', 'Commercant'].map((role) => {
            const usersByRole = Array.isArray(utilisateurs) 
              ? utilisateurs.filter(u => u.role === role)
              : [];
            
            if (usersByRole.length === 0) return null;

            return (
              <div key={role} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 px-4 py-2 bg-blue-50 rounded-lg">
                  {role}s ({usersByRole.length})
                </h2>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {usersByRole.map((user) => {
                      const credentials = credentialsMap[user.idUtilisateur];
                      const isLoadingCreds = loadingCredentials[user.idUtilisateur];
                      
                      return (
                        <li key={user.idUtilisateur}>
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {user.role}
                                      </span>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        user.statutUtilisateur === 'Actif' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {user.statutUtilisateur}
                                      </span>
                                    </div>
                                    
                                    {/* Email et mot de passe */}
                                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                                      <div>
                                        <span className="text-gray-500">Email: </span>
                                        <span className="font-medium text-gray-900">{user.email}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500">Mot de passe initial: </span>
                                        {isLoadingCreds ? (
                                          <span className="text-gray-400">Chargement...</span>
                                        ) : credentials ? (
                                          <span className="font-mono font-medium text-gray-900 bg-yellow-50 px-2 py-1 rounded">
                                            {credentials.motDePasseInitial}
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => loadUserCredentials(user.idUtilisateur)}
                                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                                          >
                                            Charger
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Créateur et date */}
                                    <div className="grid grid-cols-2 gap-4 mt-2 text-xs text-gray-500">
                                      <div>
                                        {user.createdBy ? (
                                          <>
                                            <span>Créé par: </span>
                                            <span className="font-medium">{user.createdBy.email}</span>
                                          </>
                                        ) : (
                                          <span>Créateur: Non disponible</span>
                                        )}
                                      </div>
                                      <div>
                                        Créé le {new Date(user.dateCreation).toLocaleDateString('fr-FR', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => handleUpdateStatut(user.idUtilisateur, user.statutUtilisateur)}
                                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                                    user.statutUtilisateur === 'Actif'
                                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    user.statutUtilisateur === 'Actif'
                                      ? 'focus:ring-red-500'
                                      : 'focus:ring-green-500'
                                  }`}
                                >
                                  {user.statutUtilisateur === 'Actif' ? 'Bloquer' : 'Activer'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUser(user);
                                    setShowPasswordModal(true);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setShowPassword(false);
                                    setError('');
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  Réinitialiser mot de passe
                                </button>
                                <button
                                  onClick={() => handleDelete(user.idUtilisateur)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}

          {Array.isArray(utilisateurs) && utilisateurs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de réinitialisation du mot de passe */}
      {showPasswordModal && editingUser && (() => {
        const passwordStrength = getPasswordStrength(newPassword);
        return (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                onClick={() => {
                  if (!isResettingPassword) {
                    setShowPasswordModal(false);
                    setEditingUser(null);
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowPassword(false);
                    setError('');
                  }
                }}
              ></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Réinitialiser le mot de passe
                    </h3>
                    <button
                      onClick={() => {
                        if (!isResettingPassword) {
                          setShowPasswordModal(false);
                          setEditingUser(null);
                          setNewPassword('');
                          setConfirmPassword('');
                          setShowPassword(false);
                          setError('');
                        }
                      }}
                      className="text-gray-400 hover:text-gray-500"
                      disabled={isResettingPassword}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Utilisateur:</span>{' '}
                      <span className="text-blue-700">{editingUser.email}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          maxLength={255}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setError('');
                          }}
                          placeholder="Entrez le nouveau mot de passe"
                          disabled={isResettingPassword}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isResettingPassword}
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 3m3.29 3.29L12 12m-5.71-5.71L12 12" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Indicateur de force du mot de passe */}
                      {newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Force du mot de passe:</span>
                            <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                              style={{ width: `${((passwordStrength.strength + 1) / 5) * 100}%` }}
                            />
                          </div>
                          <ul className="mt-2 text-xs text-gray-500 space-y-1">
                            <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                              {newPassword.length >= 8 ? '✓' : '○'} Au moins 8 caractères
                            </li>
                            <li className={newPassword.length >= 12 ? 'text-green-600' : ''}>
                              {newPassword.length >= 12 ? '✓' : '○'} Au moins 12 caractères (recommandé)
                            </li>
                            <li className={/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                              {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) ? '✓' : '○'} Majuscules et minuscules
                            </li>
                            <li className={/\d/.test(newPassword) ? 'text-green-600' : ''}>
                              {/\d/.test(newPassword) ? '✓' : '○'} Au moins un chiffre
                            </li>
                            <li className={/[^a-zA-Z\d]/.test(newPassword) ? 'text-green-600' : ''}>
                              {/[^a-zA-Z\d]/.test(newPassword) ? '✓' : '○'} Au moins un caractère spécial
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          maxLength={255}
                          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            confirmPassword && newPassword !== confirmPassword
                              ? 'border-red-300 bg-red-50'
                              : confirmPassword && newPassword === confirmPassword
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-300'
                          }`}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError('');
                          }}
                          placeholder="Confirmez le nouveau mot de passe"
                          disabled={isResettingPassword}
                        />
                        {confirmPassword && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {newPassword === confirmPassword ? (
                              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
                      {confirmPassword && newPassword === confirmPassword && (
                        <p className="mt-1 text-xs text-green-600">
                          Les mots de passe correspondent
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {isResettingPassword ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Réinitialisation...
                      </>
                    ) : (
                      'Réinitialiser'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isResettingPassword) {
                        setShowPasswordModal(false);
                        setEditingUser(null);
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowPassword(false);
                        setError('');
                      }
                    }}
                    disabled={isResettingPassword}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de création */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Créer un nouvel utilisateur
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.motDePasseHash}
                        onChange={(e) => setFormData({ ...formData, motDePasseHash: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rôle</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Admin' | 'Agent' | 'Caisse' })}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Agent">Agent</option>
                        <option value="Caisse">Caissier</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.statutUtilisateur}
                        onChange={(e) => setFormData({ ...formData, statutUtilisateur: e.target.value as 'Actif' | 'Bloqué' })}
                      >
                        <option value="Actif">Actif</option>
                        <option value="Bloqué">Bloqué</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );}
