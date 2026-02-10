'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AgentSidebar from '@/components/AgentSidebar';
import { commerçantService, Commercant } from '@/lib/services/commercantService';
import { compteService } from '@/lib/services/compteService';
import { Agent } from '@/lib/services/agentService';
import { getCurrentAgent } from '@/lib/utils/agentUtils';

export default function AgentClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Commercant[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [comptesMap, setComptesMap] = useState<Record<number, string>>({});
  const [soldeMap, setSoldeMap] = useState<Record<number, number>>({});

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
      
      // Récupérer l'agent actuel
      console.log('Récupération de l\'agent connecté...');
      const agentConnecte = await getCurrentAgent();
      console.log('Agent connecté:', agentConnecte);

      if (!agentConnecte) {
        console.error('Agent non trouvé');
        throw new Error('Agent non trouvé. Veuillez vous reconnecter.');
      }

      if (!agentConnecte.idAgent) {
        console.error('ID agent manquant:', agentConnecte);
        throw new Error('ID agent manquant. Veuillez vous reconnecter.');
      }

      setAgent(agentConnecte);
      console.log('Chargement des clients pour l\'agent ID:', agentConnecte.idAgent);

      // Charger les clients de l'agent
      const clientsData = await commerçantService.getByAgent(agentConnecte.idAgent);
      console.log('Clients reçus:', clientsData);
      console.log('Type de clientsData:', typeof clientsData, Array.isArray(clientsData));
      
      // S'assurer que clientsData est un tableau
      if (!Array.isArray(clientsData)) {
        console.error('La réponse de getByAgent n\'est pas un tableau:', clientsData);
        setError('Erreur: Les données reçues ne sont pas au format attendu.');
        setClients([]);
        return;
      }
      
      setClients(clientsData);

      // Charger les comptes et soldes pour chaque client
      const comptesPromises = clientsData.map(async (client) => {
        try {
          const comptes = await compteService.getByCommercant(client.idCommercant);
          const solde = comptes.length > 0 ? comptes.reduce((sum, compte) => sum + compte.soldeActuel, 0) : 0;
          return {
            clientId: client.idCommercant,
            numeroCompte: comptes.length > 0 ? comptes[0].numeroCompte : null,
            solde,
          };
        } catch {
          return { clientId: client.idCommercant, numeroCompte: null, solde: 0 };
        }
      });

      const comptesResults = await Promise.all(comptesPromises);
      const newComptesMap: Record<number, string> = {};
      const newSoldeMap: Record<number, number> = {};
      comptesResults.forEach(({ clientId, numeroCompte, solde }) => {
        if (numeroCompte) {
          newComptesMap[clientId] = numeroCompte;
        }
        newSoldeMap[clientId] = solde;
      });
      setComptesMap(newComptesMap);
      setSoldeMap(newSoldeMap);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XOF', 'FCFA');
  };

  const filteredClients = clients.filter(client =>
    client.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.nomBoutique?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm) ||
    client.zoneCollecte.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar />
      <div className="page-with-sidebar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Clients</h1>
              <p className="mt-2 text-gray-600">
                {agent && `Agent: ${agent.nomAgent} (${agent.codeAgent})`}
              </p>
            </div>
            <Link
              href="/agent/clients/ajouter"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter un Client
            </Link>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Recherche */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Statistiques */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{filteredClients.length}</span> client(s)
            </p>
          </div>

          {/* Liste des clients */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
              </div>
            ) : (
              <div className="table-responsive overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom Complet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Boutique
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Téléphone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro Compte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solde
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.idCommercant} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.nomComplet}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{client.nomBoutique || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{client.telephone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{client.zoneCollecte}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {comptesMap[client.idCommercant] || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {formatFCFA(soldeMap[client.idCommercant] || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/agent/collectes/ajouter?clientId=${client.idCommercant}`}
                            className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Collecte
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
