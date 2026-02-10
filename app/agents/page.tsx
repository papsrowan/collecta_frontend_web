'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { agentService, Agent, CreateAgentRequest } from '@/lib/services/agentService';
import { utilisateurService, User, UserCredentials } from '@/lib/services/utilisateurService';
import { authService } from '@/lib/auth';

interface AgentWithEmail extends Agent {
  email?: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentWithEmail[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateAgentRequest>({
    idUtilisateur: 0,
    codeAgent: '',
    nomAgent: '',
    telephone: '',
    zoneAffectation: '',
    objectMensuelFcfa: 0,
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    // Vérifier si l'utilisateur est Admin
    const checkAdmin = async () => {
      try {
        // D'abord vérifier localStorage (plus rapide)
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        if (userRole?.toUpperCase() === 'ADMIN' || userRole?.toUpperCase() === 'ADJOINT') {
          setIsAdmin(true);
          return;
        }
        
        // Sinon, vérifier via l'API
        const currentUser = await authService.getCurrentUser();
        console.log('Current user from API:', currentUser);
        const isAdminUser = currentUser.authorities?.some((auth: any) => {
          const authority = auth?.authority || auth;
          return authority === 'ROLE_Admin' || authority === 'ROLE_Adjoint' || authority === 'ROLE_ADMIN' || authority === 'Admin' || authority === 'Adjoint';
        }) || false;
        console.log('Is admin user:', isAdminUser);
        setIsAdmin(isAdminUser);
      } catch (err) {
        console.error('Error checking admin:', err);
        // Fallback vers localStorage
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
        setIsAdmin(userRole?.toUpperCase() === 'ADMIN' || userRole?.toUpperCase() === 'ADJOINT');
      }
    };
    checkAdmin();

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [agentsData, usersData] = await Promise.all([
        agentService.getAll(),
        utilisateurService.getAll(),
      ]);
      
      // Créer un map email par idUtilisateur
      const emailMap: Record<number, string> = {};
      usersData.forEach(user => {
        emailMap[user.idUtilisateur] = user.email;
      });
      
      // Enrichir les agents avec les emails
      const agentsWithEmail: AgentWithEmail[] = agentsData.map(agent => ({
        ...agent,
        email: emailMap[agent.idUtilisateur] || '',
      }));
      
      setAgents(agentsWithEmail);
      setUtilisateurs(usersData.filter(u => u.role === 'Agent'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const agentsData = await agentService.getAll();
      const usersData = await utilisateurService.getAll();
      
      // Créer un map email par idUtilisateur
      const emailMap: Record<number, string> = {};
      usersData.forEach(user => {
        emailMap[user.idUtilisateur] = user.email;
      });
      
      // Filtrer les agents
      const searchLower = searchTerm.toLowerCase();
      const filtered = agentsData.filter(agent => {
        const email = emailMap[agent.idUtilisateur] || '';
        return (
          agent.nomAgent.toLowerCase().includes(searchLower) ||
          agent.codeAgent.toLowerCase().includes(searchLower) ||
          agent.telephone.includes(searchTerm) ||
          agent.zoneAffectation.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower)
        );
      });
      
      const agentsWithEmail: AgentWithEmail[] = filtered.map(agent => ({
        ...agent,
        email: emailMap[agent.idUtilisateur] || '',
      }));
      
      setAgents(agentsWithEmail);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await agentService.create(formData);
      setShowModal(false);
      setFormData({
        idUtilisateur: 0,
        codeAgent: '',
        nomAgent: '',
        telephone: '',
        zoneAffectation: '',
        objectMensuelFcfa: 0,
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'agent');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
      return;
    }

    try {
      await agentService.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleShowCredentials = async (agent: Agent) => {
    try {
      setLoadingCredentials(true);
      const credentials = await utilisateurService.getCredentials(agent.idUtilisateur);
      setSelectedCredentials({
        email: credentials.email,
        password: credentials.motDePasseInitial,
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

  if (loading && (!Array.isArray(agents) || agents.length === 0)) {
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
              <h1 className="text-3xl font-bold text-gray-800">Gestion des Agents</h1>
              <Link
                href="/agents/ajouter"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvel agent
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
                  placeholder="Rechercher par nom, code, téléphone, zone ou email..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {Array.isArray(agents) ? agents.map((agent) => (
                <div key={agent.idAgent} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-bold text-gray-800 mr-3">{agent.nomAgent}</h3>
                      </div>
                      <div className="space-y-1 mt-3">
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Code: <span className="font-semibold ml-1">{agent.codeAgent}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {agent.telephone}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {agent.zoneAffectation}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Objectif mensuel: <span className="font-semibold ml-1">{agent.objectMensuelFcfa.toLocaleString('fr-FR')} FCFA</span>
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email: <span className="font-semibold ml-1">{agent.email || 'Non disponible'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/agents/${agent.idAgent}/historique`}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Historique
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={() => handleShowCredentials(agent)}
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
                        onClick={() => handleDelete(agent.idAgent)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-semibold rounded-xl text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              )) : null}
            </div>

            {Array.isArray(agents) && agents.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun agent trouvé</p>
              </div>
            )}
          </div>
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
    </div>
  );
}
