'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { commerçantService, Commercant } from '@/lib/services/commercantService';

interface ClientWithCredentials extends Commercant {
  email?: string;
  initialPassword?: string;
  showCredentials?: boolean;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientWithCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithCredentials | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadClients();
  }, [router]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await commerçantService.getAll();
      // Trier par nom complet
      const sorted = data.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));
      setClients(sorted.map(client => ({ ...client, showCredentials: false })));
    } catch (err: any) {
      console.error('Erreur lors du chargement des clients:', err);
      setError('Erreur lors du chargement des clients. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async (client: ClientWithCredentials) => {
    try {
      const credentials = await commerçantService.getIdentifiants(client.idCommercant);
      setClients(prevClients =>
        prevClients.map(c =>
          c.idCommercant === client.idCommercant
            ? { ...c, email: credentials.email, initialPassword: credentials.initialPassword, showCredentials: true }
            : c
        )
      );
      setSelectedClient({
        ...client,
        email: credentials.email,
        initialPassword: credentials.initialPassword,
        showCredentials: true,
      });
    } catch (err: any) {
      console.error('Erreur lors du chargement des identifiants:', err);
      alert('Erreur lors du chargement des identifiants. Veuillez réessayer.');
    }
  };

  const hideCredentials = (clientId: number) => {
    setClients(prevClients =>
      prevClients.map(c =>
        c.idCommercant === clientId ? { ...c, showCredentials: false, email: undefined, initialPassword: undefined } : c
      )
    );
    if (selectedClient?.idCommercant === clientId) {
      setSelectedClient(null);
    }
  };

  const filteredClients = clients.filter(client =>
    client.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.nomBoutique?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telephone.includes(searchTerm) ||
    client.zoneCollecte.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="page-with-sidebar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Liste des Clients</h1>
            <p className="mt-2 text-gray-600">Consultez la liste des clients et leurs identifiants</p>
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
                Aucun client trouvé
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
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Identifiants
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
                          <div className="text-sm text-gray-500">{client.agentAttitre.nomAgent}</div>
                          <div className="text-xs text-gray-400">({client.agentAttitre.codeAgent})</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.showCredentials && client.email && client.initialPassword ? (
                            <div className="text-sm">
                              <div className="text-gray-900 font-medium">Email: {client.email}</div>
                              <div className="text-gray-700 mt-1">Mot de passe: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{client.initialPassword}</span></div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!client.showCredentials ? (
                            <button
                              onClick={() => loadCredentials(client)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Afficher
                            </button>
                          ) : (
                            <button
                              onClick={() => hideCredentials(client.idCommercant)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Masquer
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de détails */}
          {selectedClient && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Détails du Client</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nom Complet:</p>
                      <p className="text-sm text-gray-900">{selectedClient.nomComplet}</p>
                    </div>
                    {selectedClient.nomBoutique && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Boutique:</p>
                        <p className="text-sm text-gray-900">{selectedClient.nomBoutique}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Téléphone:</p>
                      <p className="text-sm text-gray-900">{selectedClient.telephone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Zone de Collecte:</p>
                      <p className="text-sm text-gray-900">{selectedClient.zoneCollecte}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Adresse Repère:</p>
                      <p className="text-sm text-gray-900">{selectedClient.adresseRepere}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Agent Attitré:</p>
                      <p className="text-sm text-gray-900">{selectedClient.agentAttitre.nomAgent} ({selectedClient.agentAttitre.codeAgent})</p>
                    </div>
                    {selectedClient.showCredentials && selectedClient.email && selectedClient.initialPassword && (
                      <>
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm font-medium text-gray-500">Email:</p>
                          <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded mt-1">{selectedClient.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Mot de passe initial:</p>
                          <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded mt-1">{selectedClient.initialPassword}</p>
                        </div>
                      </>
                    )}
                    {selectedClient.dateCreation && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date de Création:</p>
                        <p className="text-sm text-gray-900">{formatDate(selectedClient.dateCreation)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setSelectedClient(null)}
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
      </div>
    </div>
  );
}
