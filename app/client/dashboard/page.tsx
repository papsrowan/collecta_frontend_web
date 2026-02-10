'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { compteService, Compte } from '@/lib/services/compteService';
import { collecteService, Collecte } from '@/lib/services/collecteService';
import { commerçantService, Commercant } from '@/lib/services/commercantService';
import { fraisEntretienService } from '@/lib/services/fraisEntretienService';
import { agentService, Agent } from '@/lib/services/agentService';
// Format FCFA utility
const formatFCFA = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XOF', 'FCFA');
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [recentCollectes, setRecentCollectes] = useState<Collecte[]>([]);
  const [commercant, setCommercant] = useState<Commercant | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soldeTotal, setSoldeTotal] = useState(0);
  const [nombreCollectes, setNombreCollectes] = useState(0);
  const [montantMoisActuel, setMontantMoisActuel] = useState(0);
  const [tauxEntretien, setTauxEntretien] = useState<number | null>(null);
  const [montantFraisMensuel, setMontantFraisMensuel] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      // Attendre que le composant soit monté côté client
      if (typeof window === 'undefined') {
        return;
      }

      // Attendre plus longtemps pour s'assurer que localStorage est accessible et que le token est stocké
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      console.log('DEBUG Dashboard: Token présent:', !!token);
      console.log('DEBUG Dashboard: Token (premiers 20 caractères):', token ? token.substring(0, 20) + '...' : 'null');
      console.log('DEBUG Dashboard: Rôle:', userRole);
      
      if (!token) {
        console.warn('DEBUG Dashboard: ⚠️ Aucun token trouvé, redirection vers login');
        // Utiliser replace au lieu de push pour éviter les problèmes de navigation
        router.replace('/login');
        return;
      }

      // Vérifier le rôle (tolérant aux variations de casse)
      if (userRole && userRole.toUpperCase() !== 'COMMERCANT') {
        console.warn('DEBUG Dashboard: ⚠️ Rôle incorrect:', userRole, 'attendu: COMMERCANT');
        router.replace('/login');
        return;
      }

      console.log('DEBUG Dashboard: ✅ Authentification OK, chargement des données dans 200ms...');
      // Attendre encore un peu avant de charger les données pour s'assurer que tout est prêt
      await new Promise(resolve => setTimeout(resolve, 200));
      loadData();
    };

    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Vérifier à nouveau que le token est présent avant de faire les requêtes
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        console.error('DEBUG Dashboard: ⚠️ Token manquant avant loadData, redirection');
        router.replace('/login');
        return;
      }
      console.log('DEBUG Dashboard: ✅ Token présent avant loadData, token:', token.substring(0, 20) + '...');

      // Charger le profil du commerçant d'abord pour obtenir l'ID
      console.log('DEBUG Dashboard: Appel de getMonProfil()...');
      const commercantData = await commerçantService.getMonProfil();
      console.log('DEBUG Dashboard: ✅ getMonProfil() réussi');
      setCommercant(commercantData);

      // Charger les comptes en utilisant l'ID du commerçant
      let comptesData: Compte[] = [];
      try {
        // Essayer d'abord l'endpoint mes-comptes
        comptesData = await compteService.getMesComptes();
      } catch (e: any) {
        // Si l'endpoint n'existe pas, utiliser l'endpoint avec l'ID du commerçant
        if (e.response?.status === 404 || e.response?.status === 403) {
          if (commercantData.idCommercant) {
            comptesData = await compteService.getByCommercant(commercantData.idCommercant);
          }
        } else {
          throw e;
        }
      }
      
      setComptes(comptesData);
      const total = comptesData.reduce((sum, compte) => sum + compte.soldeActuel, 0);
      setSoldeTotal(total);

      // Utiliser les informations de l'agent déjà présentes dans commercantData
      // L'endpoint /api/agents/{id} n'est pas accessible aux clients (COMMERCANT)
      // mais les informations de base de l'agent sont déjà dans agentAttitre
      if (commercantData.agentAttitre) {
        // Créer un objet Agent avec les champs disponibles
        // Les champs manquants (telephone, zoneAffectation, etc.) seront undefined
        const agentData: Agent = {
          idAgent: commercantData.agentAttitre.idAgent,
          nomAgent: commercantData.agentAttitre.nomAgent,
          codeAgent: commercantData.agentAttitre.codeAgent,
          // Champs requis mais non disponibles - utiliser des valeurs par défaut
          idUtilisateur: 0, // Non disponible
          telephone: '', // Non disponible, mais le code vérifie avant d'afficher
          zoneAffectation: '', // Non disponible
          objectMensuelFcfa: 0, // Non disponible
        };
        setAgent(agentData);
        console.log('DEBUG Dashboard: Informations de l\'agent récupérées depuis commercantData');
      }

      // Charger les collectes
      const allCollectes: Collecte[] = [];
      for (const compte of comptesData) {
        try {
          const collectes = await collecteService.getByCompte(compte.numeroCompte);
          allCollectes.push(...collectes);
        } catch (e) {
          console.error('Erreur lors du chargement des collectes:', e);
        }
      }

      // Trier par date décroissante
      allCollectes.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime());
      setRecentCollectes(allCollectes.slice(0, 5));
      setNombreCollectes(allCollectes.length);

      // Calculer le montant du mois actuel
      const maintenant = new Date();
      const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
      const montantMois = allCollectes
        .filter(c => new Date(c.dateCollecte) >= debutMois)
        .reduce((sum, c) => sum + c.montant, 0);
      setMontantMoisActuel(montantMois);

      // Charger le taux d'entretien
      try {
        const tauxData = await fraisEntretienService.getMonTaux();
        setTauxEntretien(tauxData.taux);
        if (tauxData.taux && total > 0) {
          setMontantFraisMensuel((total * tauxData.taux) / 100);
        }
      } catch (e) {
        console.error('Erreur lors du chargement du taux d\'entretien:', e);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      console.error('Détails de l\'erreur:', err.response?.data);
      
      // Si erreur 401, vérifier d'abord si le token existe vraiment
      if (err.response?.status === 401) {
        console.error('Erreur 401: Token expiré ou invalide');
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        console.error('DEBUG Dashboard: Token dans localStorage lors de l\'erreur 401:', !!token);
        
        // Si le token n'existe pas, c'est qu'il n'a pas été stocké correctement
        if (!token) {
          console.error('DEBUG Dashboard: Token manquant, redirection vers login');
          router.replace('/login');
          return;
        }
        
        // Si le token existe mais la requête échoue avec 401, c'est que le token est invalide ou expiré
        console.error('DEBUG Dashboard: Token présent mais invalide, nettoyage et redirection');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('commercantId');
        }
        // Attendre un peu avant de rediriger pour éviter les problèmes de navigation
        setTimeout(() => {
          router.replace('/login');
        }, 300);
        return;
      }
      
      // Si erreur 403, vérifier si c'est un problème d'autorisation ou de données manquantes
      if (err.response?.status === 403) {
        console.error('Erreur 403: Accès refusé');
        // Ne pas rediriger immédiatement, afficher l'erreur
        let errorMessage = err.response?.data?.message || 'Accès refusé. Veuillez contacter l\'administrateur.';
        setError(errorMessage);
        return;
      }
      
      // Si erreur 404, ne pas rediriger mais afficher l'erreur (peut être un problème de données)
      if (err.response?.status === 404) {
        console.error('Erreur 404: Ressource non trouvée');
        let errorMessage = err.response?.data?.message || 'Données non trouvées. Veuillez contacter l\'administrateur.';
        setError(errorMessage);
        return;
      }
      
      // Si erreur 500 ou autre erreur serveur, ne pas rediriger mais afficher l'erreur
      // Cela permet de voir l'erreur plutôt que de rediriger immédiatement
      let errorMessage = 'Erreur lors du chargement des données. Veuillez réessayer.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ClientSidebar />
        <div className="page-with-sidebar flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ClientSidebar />
      <div className="page-with-sidebar">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
              <p className="mt-2 text-gray-600">Bienvenue, {commercant?.nomComplet || 'Client'}</p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Carte Solde Total */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-100">Solde Total</span>
                <svg className="w-8 h-8 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-4xl font-bold mb-1">{formatFCFA(soldeTotal)}</p>
              <p className="text-green-100 text-sm">{comptes.length} compte(s)</p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Collectes</p>
                    <p className="text-2xl font-bold text-gray-900">{nombreCollectes}</p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ce Mois</p>
                    <p className="text-2xl font-bold text-gray-900">{formatFCFA(montantMoisActuel)}</p>
                  </div>
                  <div className="text-purple-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {tauxEntretien !== null && (
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Frais d'entretien</p>
                      <p className="text-2xl font-bold text-gray-900">{tauxEntretien.toFixed(2)}%</p>
                      <p className="text-xs text-gray-500 mt-1">≈ {formatFCFA(montantFraisMensuel)}/mois</p>
                    </div>
                    <div className="text-orange-600">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {agent && (
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Agent Attitré</p>
                      <p className="text-lg font-bold text-gray-900 truncate">{agent.nomAgent}</p>
                      {agent.telephone && (
                        <p className="text-xs text-gray-500 mt-1">{agent.telephone}</p>
                      )}
                    </div>
                    <div className="text-indigo-600">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dernières Collectes */}
            {recentCollectes.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Dernières Collectes</h2>
                  <a href="/client/historique" className="text-sm text-green-600 font-medium hover:text-green-700">
                    Voir tout →
                  </a>
                </div>
                <div className="space-y-3">
                  {recentCollectes.map((collecte) => (
                    <div key={collecte.idCollecte} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Versement</p>
                          <p className="text-sm text-gray-500">{formatDate(collecte.dateCollecte)}</p>
                          <p className="text-xs text-gray-500">Mode: {collecte.modePaiement}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{formatFCFA(collecte.montant)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mes Comptes */}
            {comptes.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Mes Comptes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comptes.map((compte) => (
                    <div key={compte.numeroCompte} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{compte.numeroCompte}</p>
                          <p className="text-sm text-gray-500">Statut: {compte.statutCompte}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">{formatFCFA(compte.soldeActuel)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
