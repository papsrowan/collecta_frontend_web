'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { commerçantService, Commercant, CreateCommercantRequest } from '@/lib/services/commercantService';
import { agentService, Agent } from '@/lib/services/agentService';
import { compteService } from '@/lib/services/compteService';
import { utilisateurService, User } from '@/lib/services/utilisateurService';
import { authService } from '@/lib/auth';

interface CommercantWithEmail extends Commercant {
  email?: string;
}

export default function CommercantsPage() {
  const router = useRouter();
  const [commercants, setCommercants] = useState<CommercantWithEmail[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [comptesMap, setComptesMap] = useState<Record<number, string>>({});
  const [emailsMap, setEmailsMap] = useState<Record<number, string>>({});
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState<CreateCommercantRequest>({
    agentAttitre: { idAgent: 0 },
    nomComplet: '',
    nomBoutique: '',
    telephone: '',
    email: '',
    zoneCollecte: '',
    adresseRepere: '',
    photoProfilUrl: '',
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
        // D'abord vérifier localStorage (rôle stocké en majuscules au login)
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        const roleUpper = userRole?.toUpperCase();
        if (roleUpper === 'ADMIN' || roleUpper === 'ADJOINT') {
          adminStatus = true;
          setIsAdmin(true);
        } else {
          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser?.authorities) {
              adminStatus = currentUser.authorities.some((auth: any) => {
                const authority = (auth?.authority ?? auth)?.toString() ?? '';
                return /ROLE_ADMIN|ROLE_Adjoint|Admin|Adjoint/i.test(authority);
              });
            }
            setIsAdmin(adminStatus);
          } catch (apiErr) {
            adminStatus = roleUpper === 'ADMIN' || roleUpper === 'ADJOINT';
            setIsAdmin(adminStatus);
          }
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        // Fallback vers localStorage (rôle en majuscules)
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        adminStatus = userRole?.toUpperCase() === 'ADMIN' || userRole?.toUpperCase() === 'ADJOINT';
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
      setError(''); // Clear previous errors
      console.log('Chargement des commercants...');
      const [commercantsData, agentsData, usersData] = await Promise.all([
        commerçantService.getAll(),
        agentService.getAll(),
        utilisateurService.getAll(),
      ]);
      
      console.log('commercantsData reçu:', commercantsData);
      console.log('Type de commercantsData:', typeof commercantsData, Array.isArray(commercantsData));
      
      // S'assurer que commercantsData est un tableau
      const commercantsArray = Array.isArray(commercantsData) ? commercantsData : [];
      console.log(`Nombre de commercants à afficher: ${commercantsArray.length}`);
      
      // Charger les emails pour chaque commerçant (seulement si admin)
      const emailsMapNew: Record<number, string> = {};
      if (adminStatus && commercantsArray.length > 0) {
        // Charger les identifiants pour chaque commerçant (en parallèle)
        const emailPromises = commercantsArray.map(async (commercant) => {
          try {
            const credentials = await commerçantService.getIdentifiants(commercant.idCommercant);
            emailsMapNew[commercant.idCommercant] = credentials.email;
          } catch (err) {
            // Ignorer les erreurs pour ne pas bloquer l'affichage
          }
        });
        await Promise.all(emailPromises);
      }
      
      setEmailsMap(emailsMapNew);
      setCommercants(commercantsArray);
      
      // S'assurer que agentsData est un tableau
      const agentsArray = Array.isArray(agentsData) ? agentsData : [];
      setAgents(agentsArray);
      
      // Charger les comptes pour chaque commerçant
      const comptesPromises = commercantsArray.map(async (commercant) => {
        try {
          const comptes = await compteService.getByCommercant(commercant.idCommercant);
          return { commerçantId: commercant.idCommercant, numeroCompte: comptes.length > 0 ? comptes[0].numeroCompte : null };
        } catch {
          return { commerçantId: commercant.idCommercant, numeroCompte: null };
        }
      });
      
      const comptesResults = await Promise.all(comptesPromises);
      const newComptesMap: Record<number, string> = {};
      comptesResults.forEach(({ commerçantId, numeroCompte }) => {
        if (numeroCompte) {
          newComptesMap[commerçantId] = numeroCompte;
        }
      });
      setComptesMap(newComptesMap);
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      console.error('Message:', err.message);
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des données');
      setCommercants([]); // Réinitialiser à un tableau vide en cas d'erreur
      setAgents([]); // Réinitialiser aussi les agents
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const results = await commerçantService.search(searchTerm || undefined);
      // S'assurer que results est un tableau
      const resultsArray = Array.isArray(results) ? results : [];
      
      // Charger les emails pour les résultats de recherche (seulement si admin)
      const emailsMapNew: Record<number, string> = {};
      if (isAdmin) {
        const emailPromises = resultsArray.slice(0, 10).map(async (commercant) => {
          try {
            const credentials = await commerçantService.getIdentifiants(commercant.idCommercant);
            emailsMapNew[commercant.idCommercant] = credentials.email;
          } catch (err) {
            // Ignorer les erreurs
          }
        });
        await Promise.all(emailPromises);
      }
      
      setEmailsMap(emailsMapNew);
      setCommercants(resultsArray);
    } catch (err: any) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
      setCommercants([]); // Réinitialiser à un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.agentAttitre.idAgent) {
      setError('Veuillez sélectionner un agent');
      return;
    }

    try {
      await commerçantService.create(formData);
      setShowModal(false);
      setFormData({
        agentAttitre: { idAgent: 0 },
        nomComplet: '',
        nomBoutique: '',
        telephone: '',
        email: '',
        zoneCollecte: '',
        adresseRepere: '',
        photoProfilUrl: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du commerçant');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commerçant ?')) {
      return;
    }

    try {
      await commerçantService.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleShowCredentials = async (id: number) => {
    try {
      setLoadingCredentials(true);
      const credentials = await commerçantService.getIdentifiants(id);
      setSelectedCredentials({
        email: credentials.email,
        password: credentials.initialPassword,
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

  if (loading && (!Array.isArray(commercants) || commercants.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="page-with-sidebar">
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
      <div className="page-with-sidebar">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Gestion des Commerçants</h1>
            <Link
              href="/commercants/ajouter"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau commerçant
            </Link>
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
                placeholder="Rechercher par nom..."
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
            {Array.isArray(commercants) ? commercants.map((commercant) => (
              <div key={commercant.idCommercant} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-bold text-gray-800 mr-3">{commercant.nomComplet}</h3>
                    </div>
                    {commercant.nomBoutique && (
                      <p className="text-sm text-gray-600 mb-1">🏢 {commercant.nomBoutique}</p>
                    )}
                    <div className="space-y-1 mt-3">
                      <p className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {commercant.telephone}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {commercant.zoneCollecte}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {commercant.agentAttitre.nomAgent} ({commercant.agentAttitre.codeAgent})
                      </p>
                      {comptesMap[commercant.idCommercant] && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Numéro de compte: <span className="font-semibold ml-1">{comptesMap[commercant.idCommercant]}</span>
                        </p>
                      )}
                      {emailsMap[commercant.idCommercant] && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email: <span className="font-semibold ml-1">{emailsMap[commercant.idCommercant]}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Créé le {new Date(commercant.dateCreation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/commercants/${commercant.idCommercant}/historique`}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Historique
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => handleShowCredentials(commercant.idCommercant)}
                        disabled={loadingCredentials}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all disabled:opacity-50"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Identifiant
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(commercant.idCommercant)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            )):null}
          </div>

          {Array.isArray(commercants) && commercants.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun commerçant trouvé</p>
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
                    Créer un nouveau commerçant
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Agent attitré *</label>
                      <select
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.agentAttitre.idAgent}
                        onChange={(e) => setFormData({
                          ...formData,
                          agentAttitre: { idAgent: parseInt(e.target.value) }
                        })}
                      >
                        <option value="0">Sélectionner un agent</option>
                        {agents.map((agent) => (
                          <option key={agent.idAgent} value={agent.idAgent}>
                            {agent.nomAgent} ({agent.codeAgent})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom complet *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.nomComplet}
                        onChange={(e) => setFormData({ ...formData, nomComplet: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom de boutique</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.nomBoutique}
                        onChange={(e) => setFormData({ ...formData, nomBoutique: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Téléphone *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.telephone}
                        onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      />
                    </div>
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
                      <label className="block text-sm font-medium text-gray-700">Zone de collecte *</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.zoneCollecte}
                        onChange={(e) => setFormData({ ...formData, zoneCollecte: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adresse repère *</label>
                      <textarea
                        required
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.adresseRepere}
                        onChange={(e) => setFormData({ ...formData, adresseRepere: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL photo de profil</label>
                      <input
                        type="url"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.photoProfilUrl}
                        onChange={(e) => setFormData({ ...formData, photoProfilUrl: e.target.value })}
                      />
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

