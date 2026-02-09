'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentSidebar from '@/components/AgentSidebar';
import { agentService, Agent } from '@/lib/services/agentService';
import { statistiqueService, StatistiquesAgent } from '@/lib/services/statistiqueService';
import { authService } from '@/lib/auth';
import { getCurrentAgent } from '@/lib/utils/agentUtils';

export default function AgentProfilPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [statistiques, setStatistiques] = useState<StatistiquesAgent | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Récupérer l'email de l'utilisateur
      try {
        const currentUser = await authService.getCurrentUser();
        setEmail(currentUser.email);
      } catch (err) {
        console.warn('Impossible de récupérer l\'email:', err);
      }
      
      // Récupérer l'agent actuel
      const agentConnecte = await getCurrentAgent();

      if (!agentConnecte) {
        throw new Error('Agent non trouvé. Veuillez vous reconnecter.');
      }

      setAgent(agentConnecte);

      // Charger les statistiques de l'agent
      try {
        const stats = await statistiqueService.getMesStatistiques();
        setStatistiques(stats);
      } catch (err) {
        console.warn('Statistiques non disponibles:', err);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XOF', 'FCFA');
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Agent non trouvé'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar />
      <div className="flex-1 ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
            <p className="mt-2 text-gray-600">Informations personnelles et statistiques</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Carte du profil */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-6 text-white">
                  <h2 className="text-2xl font-bold">{agent.nomAgent}</h2>
                  <p className="text-green-100">Code Agent: {agent.codeAgent}</p>
                  {email && <p className="text-green-100 mt-1">{email}</p>}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nom de l'Agent</label>
                  <p className="text-lg text-gray-900">{agent.nomAgent}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Code Agent</label>
                  <p className="text-lg text-gray-900">{agent.codeAgent}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Téléphone</label>
                  <p className="text-lg text-gray-900">{agent.telephone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Zone d'Affectation</label>
                  <p className="text-lg text-gray-900">{agent.zoneAffectation}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-lg text-gray-900">{email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Objectif Mensuel</label>
                  <p className="text-lg text-gray-900 font-semibold">{formatFCFA(agent.objectMensuelFcfa)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          {statistiques && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Statistiques</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-600">Total Collecté</p>
                  <p className="text-2xl font-bold text-green-800 mt-1">
                    {formatFCFA(statistiques.montantTotalCollecte)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-600">Nombre de Clients</p>
                  <p className="text-2xl font-bold text-blue-800 mt-1">
                    {statistiques.nombreCommercantsTotal}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-purple-600">Total Collectes</p>
                  <p className="text-2xl font-bold text-purple-800 mt-1">
                    {statistiques.nombreCollectesTotal}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-orange-600">Taux de Réalisation</p>
                  <p className="text-2xl font-bold text-orange-800 mt-1">
                    {formatPercentage(parseFloat(statistiques.tauxRealisationObjectif))}
                  </p>
                </div>
              </div>

              {/* Barre de progression de l'objectif */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Objectif Mensuel</span>
                  <span className="text-sm font-medium text-gray-700">
                    {formatFCFA(statistiques.montantTotalCollecte)} / {formatFCFA(statistiques.objectMensuel)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-600 h-4 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, parseFloat(statistiques.tauxRealisationObjectif))}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton de déconnexion */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
