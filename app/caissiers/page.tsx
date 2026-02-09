'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { utilisateurService, User, CreateUtilisateurRequest, UserCredentials } from '@/lib/services/utilisateurService';
import { authService } from '@/lib/auth';

export default function CaissiersPage() {
  const router = useRouter();
  const [caissiers, setCaissiers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState<CreateUtilisateurRequest>({
    email: '',
    motDePasseHash: '', // Laisser vide pour que le backend génère un mot de passe automatiquement
    role: 'Caisse',
    statutUtilisateur: 'Actif',
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    // Vérifier si l'utilisateur est Admin et charger les données
    const checkAdminAndLoadData = async () => {
      let adminStatus = false;
      try {
        // D'abord vérifier localStorage (plus rapide)
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        if (userRole === 'Admin') {
          adminStatus = true;
          setIsAdmin(true);
        } else {
          // Sinon, vérifier via l'API
          try {
            const currentUser = await authService.getCurrentUser();
            console.log('Current user from API:', currentUser);
            adminStatus = currentUser.authorities?.some((auth: any) => {
              const authority = auth?.authority || auth;
              return authority === 'ROLE_Admin' || authority === 'ROLE_ADMIN' || authority === 'Admin';
            }) || false;
            console.log('Is admin user:', adminStatus);
            setIsAdmin(adminStatus);
          } catch (apiErr) {
            console.error('Error checking admin via API:', apiErr);
            adminStatus = false;
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        // Fallback vers localStorage
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        adminStatus = userRole === 'Admin';
        setIsAdmin(adminStatus);
      }
      
      // Charger les données avec le statut admin
      loadDataWithAdminStatus(adminStatus);
    };
    
    checkAdminAndLoadData();
  }, [router]);

  const loadData = async () => {
    // Utiliser la valeur actuelle de isAdmin
    await loadDataWithAdminStatus(isAdmin);
  };

  const loadDataWithAdminStatus = async (adminStatus: boolean) => {
    try {
      setLoading(true);
      setError('');
      console.log('Chargement des caissiers...');
      const usersData = await utilisateurService.getAll();
      
      console.log('usersData reçu:', usersData);
      console.log('Type de usersData:', typeof usersData, Array.isArray(usersData));
      
      // S'assurer que usersData est un tableau
      const usersArray = Array.isArray(usersData) ? usersData : [];
      
      // Filtrer les utilisateurs avec le rôle Caisse
      const caissiersArray = usersArray.filter((user) => {
        const role = user.role || '';
        return role.toUpperCase() === 'CAISSE' || role === 'Caisse';
      });
      
      console.log(`Nombre de caissiers à afficher: ${caissiersArray.length}`);
      
      setCaissiers(caissiersArray);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      console.error('Message:', err.message);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données');
      setCaissiers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Recherche locale dans les caissiers déjà chargés
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    const filtered = caissiers.filter((caissier) =>
      caissier.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setCaissiers(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email) {
      setError('Veuillez entrer un email');
      return;
    }

    try {
      await utilisateurService.create(formData);
      setShowModal(false);
      setFormData({
        email: '',
        motDePasseHash: '',
        role: 'Caisse',
        statutUtilisateur: 'Actif',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du caissier');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce caissier ?')) {
      return;
    }

    try {
      await utilisateurService.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleStatut = async (id: number, currentStatut: string) => {
    try {
      const newStatut = currentStatut === 'Actif' ? 'Bloqué' : 'Actif';
      await utilisateurService.updateStatut(id, newStatut);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleShowCredentials = async (id: number) => {
    try {
      setLoadingCredentials(true);
      const credentials = await utilisateurService.getCredentials(id);
      setSelectedCredentials({
        email: credentials.email,
        password: credentials.motDePasseInitial || '',
      });
      setShowCredentialsModal(true);
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('Accès refusé: Vous devez être administrateur pour voir les identifiants de connexion.');
      } else {
        alert('Erreur lors du chargement des identifiants. Veuillez réessayer.');
      }
    } finally {
      setLoadingCredentials(false);
    }
  };

  if (loading && (!Array.isArray(caissiers) || caissiers.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
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
            <h1 className="text-3xl font-bold text-gray-800">Gestion des Caissiers</h1>
            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau caissier
              </button>
            )}
          </div>

          {/* Barre de recherche */}
          <div className="mb-6 flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par email..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all"
            >
              Rechercher
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                loadData();
              }}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition-all"
            >
              Réinitialiser
            </button>
          </div>

          {error && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4 flex items-start">
              <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-orange-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {Array.isArray(caissiers) ? caissiers.map((caissier) => (
              <div key={caissier.idUtilisateur} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-800 mr-3">{caissier.email}</h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        caissier.statutUtilisateur === 'Actif' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {caissier.statutUtilisateur}
                      </span>
                    </div>
                    <div className="space-y-1 mt-3">
                      <p className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Rôle: <span className="font-semibold ml-1">{caissier.role}</span>
                      </p>
                      {caissier.dateCreation && (
                        <p className="text-xs text-gray-400 mt-2">
                          Créé le {new Date(caissier.dateCreation).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/caissiers/${caissier.idUtilisateur}/historique`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Historique
                    </Link>
                    <button
                      onClick={() => handleToggleStatut(caissier.idUtilisateur, caissier.statutUtilisateur || 'Actif')}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl transition-all ${
                        caissier.statutUtilisateur === 'Actif'
                          ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                          : 'text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {caissier.statutUtilisateur === 'Actif' ? 'Bloquer' : 'Activer'}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleShowCredentials(caissier.idUtilisateur)}
                        disabled={loadingCredentials}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Identifiant
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(caissier.idUtilisateur)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )):null}
          </div>

          {Array.isArray(caissiers) && caissiers.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun caissier trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal des identifiants */}
      {showCredentialsModal && selectedCredentials && (
        <div className="fixed z-50 inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Identifiants de connexion</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email:</p>
                  <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded mt-1">{selectedCredentials.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Mot de passe initial:</p>
                  <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded mt-1">{selectedCredentials.password}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setSelectedCredentials(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Créer un nouveau caissier
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email *</label>
                      <input
                        type="email"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Statut *</label>
                      <select
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.statutUtilisateur}
                        onChange={(e) => setFormData({
                          ...formData,
                          statutUtilisateur: e.target.value as 'Actif' | 'Bloqué'
                        })}
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
  );
}
