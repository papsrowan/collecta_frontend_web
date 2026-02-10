'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AgentSidebar from '@/components/AgentSidebar';
import { collecteService, CreateCollecteRequest } from '@/lib/services/collecteService';
import { compteService, Compte } from '@/lib/services/compteService';
import { commerçantService, Commercant } from '@/lib/services/commercantService';
import { getCurrentAgent } from '@/lib/utils/agentUtils';
import { Agent } from '@/lib/services/agentService';

function AjouterCollecteAgentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [client, setClient] = useState<Commercant | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateCollecteRequest>({
    compte: { numeroCompte: '' },
    agent: { idAgent: 0 },
    montant: 0,
    dateCollecte: '', // Sera défini automatiquement à la validation
    modePaiement: 'Espèces',
    statut: 'En_Attente',
    preuvePhoto: '',
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router, clientIdParam]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      setError('');

      // Récupérer l'agent actuel
      const agentConnecte = await getCurrentAgent();

      if (!agentConnecte || !agentConnecte.idAgent) {
        throw new Error('Agent non trouvé. Veuillez vous reconnecter.');
      }

      setAgent(agentConnecte);

      // Pré-remplir l'ID de l'agent dans le formulaire
      setFormData(prev => ({
        ...prev,
        agent: { idAgent: agentConnecte.idAgent }
      }));

      // Si un clientId est fourni dans l'URL, charger uniquement les comptes de ce client
      if (clientIdParam) {
        const clientId = parseInt(clientIdParam);
        if (!isNaN(clientId)) {
          try {
            // Charger les informations du client
            const clientData = await commerçantService.getById(clientId);
            setClient(clientData);

            // Vérifier que le client appartient bien à l'agent
            if (clientData.agentAttitre.idAgent !== agentConnecte.idAgent) {
              throw new Error('Ce client n\'appartient pas à votre liste de clients.');
            }

            // Charger les comptes du client
            const comptesClient = await compteService.getByCommercant(clientId);
            setComptes(comptesClient);

            // Pré-sélectionner le premier compte si disponible
            if (comptesClient.length > 0) {
              setFormData(prev => ({
                ...prev,
                compte: { numeroCompte: comptesClient[0].numeroCompte }
              }));
            }
          } catch (err: any) {
            console.error('Erreur lors du chargement du client:', err);
            setError(err.message || 'Erreur lors du chargement des données du client');
          }
        }
      } else {
        // Pas de clientId dans l'URL : charger tous les clients de l'agent
        const clients = await commerçantService.getByAgent(agentConnecte.idAgent);

        // Charger les comptes de tous les clients de l'agent
        const allComptes: Compte[] = [];
        for (const clientItem of clients) {
          try {
            const comptesClient = await compteService.getByCommercant(clientItem.idCommercant);
            allComptes.push(...comptesClient);
          } catch (err) {
            console.warn(`Impossible de charger les comptes pour le client ${clientItem.idCommercant}:`, err);
          }
        }

        setComptes(allComptes);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.compte.numeroCompte) {
      setError('Veuillez sélectionner un compte');
      return;
    }

    if (!agent || !agent.idAgent) {
      setError('Agent non trouvé. Veuillez vous reconnecter.');
      return;
    }

    if (formData.montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    try {
      setLoading(true);
      // Définir automatiquement la date et l'heure au moment de la validation
      const dateCollecte = new Date().toISOString();
      await collecteService.create({
        ...formData,
        dateCollecte, // Date/heure actuelle automatique
        agent: { idAgent: agent.idAgent },
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/agent/collectes');
      }, 1500);
    } catch (err: any) {
      console.error('Erreur lors de la création de la collecte:', err);
      setError(err.response?.data?.message || err.message || 'Erreur lors de la création de la collecte');
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

  if (loadingData) {
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
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <Link
                href="/agent/collectes"
                className="text-green-600 hover:text-green-700 text-sm font-semibold mb-4 inline-block transition-colors duration-200"
              >
                ← Retour à l'historique des collectes
              </Link>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Effectuer une Collecte</h1>
              {client ? (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Collecte pour : <span className="font-semibold text-gray-900">{client.nomComplet}</span>
                  </p>
                  {client.nomBoutique && (
                    <p className="text-xs text-gray-500 mt-1">Boutique: {client.nomBoutique}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  Enregistrez une nouvelle collecte pour un de vos clients.
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                ✅ Collecte créée avec succès ! Redirection en cours...
              </div>
            )}

            <div className="bg-white shadow-xl rounded-2xl border border-green-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Informations de la collecte</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Agent (pré-rempli et désactivé) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent
                  </label>
                  <input
                    type="text"
                    disabled
                    className="w-full border-2 border-gray-200 rounded-lg shadow-sm py-3 px-4 text-gray-500 bg-gray-50 cursor-not-allowed"
                    value={agent ? `${agent.nomAgent} (${agent.codeAgent})` : 'Chargement...'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Vous êtes l'agent enregistrant cette collecte
                  </p>
                </div>

                {/* Compte */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compte du client <span className="text-red-500">*</span>
                  </label>
                  {comptes.length === 0 ? (
                    <div className="border-2 border-yellow-200 rounded-lg shadow-sm py-3 px-4 bg-yellow-50">
                      <p className="text-yellow-800 text-sm">
                        ⚠️ {client 
                          ? `Aucun compte disponible pour ${client.nomComplet}. Veuillez créer un compte pour ce client.`
                          : 'Aucun compte disponible. Veuillez d\'abord ajouter des clients avec leurs comptes.'}
                      </p>
                      {!client && (
                        <Link
                          href="/agent/clients/ajouter"
                          className="mt-2 inline-block text-green-600 hover:text-green-700 text-sm font-semibold"
                        >
                          Ajouter un client →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      <select
                        required
                        className="w-full border-2 border-green-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        value={formData.compte.numeroCompte}
                        onChange={(e) => setFormData({
                          ...formData,
                          compte: { numeroCompte: e.target.value }
                        })}
                      >
                        {comptes.length === 1 ? (
                          <option value={comptes[0].numeroCompte}>
                            {comptes[0].numeroCompte} 
                            {comptes[0].soldeActuel !== undefined && ` (Solde: ${formatFCFA(comptes[0].soldeActuel)})`}
                          </option>
                        ) : (
                          <>
                            <option value="">Sélectionner un compte</option>
                            {comptes.map((compte) => (
                              <option key={compte.numeroCompte} value={compte.numeroCompte}>
                                {compte.numeroCompte} 
                                {client && ` - ${client.nomComplet}`}
                                {compte.soldeActuel !== undefined && ` (Solde: ${formatFCFA(compte.soldeActuel)})`}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {comptes.length === 1 
                          ? 'Compte sélectionné automatiquement'
                          : client
                          ? 'Sélectionnez le compte de ce client'
                          : 'Sélectionnez le compte du client pour lequel la collecte est effectuée'}
                      </p>
                    </>
                  )}
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full border-2 border-green-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={formData.montant || ''}
                    onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                {/* Mode de paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode de paiement <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border-2 border-green-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={formData.modePaiement}
                    onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value as any })}
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile_Money">Mobile Money</option>
                    <option value="Carte_Bancaire">Carte Bancaire</option>
                    <option value="Virement">Virement</option>
                  </select>
                </div>

                {/* Statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border-2 border-green-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                  >
                    <option value="En_Attente">En Attente</option>
                    <option value="Validé">Validé</option>
                    <option value="Rejeté">Rejeté</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Le statut "En Attente" est généralement utilisé pour les nouvelles collectes
                  </p>
                </div>

                {/* URL preuve photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL preuve photo (optionnel)
                  </label>
                  <input
                    type="url"
                    className="w-full border-2 border-green-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={formData.preuvePhoto || ''}
                    onChange={(e) => setFormData({ ...formData, preuvePhoto: e.target.value })}
                    placeholder="https://example.com/preuve.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    URL vers une photo ou un document prouvant la collecte (optionnel)
                  </p>
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Link
                    href="/agent/collectes"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || comptes.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Création...' : 'Enregistrer la collecte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AjouterCollecteAgentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <AjouterCollecteAgentPageContent />
    </Suspense>
  );
}
