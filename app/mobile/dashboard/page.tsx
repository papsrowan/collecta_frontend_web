'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { compteService, Compte } from '@/lib/services/compteService';
import { collecteService, Collecte } from '@/lib/services/collecteService';
import { commerçantService, Commercant } from '@/lib/services/commercantService';
import { fraisEntretienService } from '@/lib/services/fraisEntretienService';
import { agentService, Agent } from '@/lib/services/agentService';

export default function MobileDashboardPage() {
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
    const checkAuth = () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      
      if (!token) {
        router.push('/mobile/login');
        return;
      }

      // Vérifier le rôle (tolérant aux variations de casse)
      if (userRole && userRole.toLowerCase() !== 'commercant') {
        console.warn('Rôle utilisateur:', userRole, '- Redirection vers login');
        router.push('/mobile/login');
        return;
      }

      loadData();
    };

    checkAuth();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Vérifier à nouveau le token avant de charger les données
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        router.push('/mobile/login');
        return;
      }

      // Charger le profil du commerçant d'abord pour obtenir l'ID
      const commercantData = await commerçantService.getMonProfil();
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

      // Charger l'agent attitré
      if (commercantData.agentAttitre?.idAgent) {
        try {
          const agentData = await agentService.getById(commercantData.agentAttitre.idAgent);
          setAgent(agentData);
        } catch (e) {
          console.error('Erreur lors du chargement de l\'agent:', e);
        }
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
      
      // Si erreur 401 ou 403, rediriger vers login
      if (err.response?.status === 401 || err.response?.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('commercantId');
        }
        router.push('/mobile/login');
        return;
      }
      
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Tableau de Bord</h1>
              <p className="text-green-100 text-sm mt-1">{commercant?.nomComplet || 'Client'}</p>
            </div>
            <Link href="/mobile/profil" className="p-2 bg-white/20 rounded-full">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        {/* Carte Solde Total */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Solde Total</span>
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{formatFCFA(soldeTotal)}</p>
          <p className="text-xs text-gray-500">{comptes.length} compte(s)</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-600">Total Collectes</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{nombreCollectes}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs text-gray-600">Ce Mois</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatFCFA(montantMoisActuel)}</p>
          </div>
        </div>

        {/* Taux d'entretien */}
        {tauxEntretien !== null && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Frais d'entretien mensuel</p>
                  <p className="text-lg font-bold text-orange-700">{tauxEntretien.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500">≈ {formatFCFA(montantFraisMensuel)}/mois</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Attitré */}
        {agent && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600">Agent Attitré</p>
                <p className="font-semibold text-gray-900">{agent.nomAgent}</p>
                {agent.telephone && (
                  <p className="text-xs text-gray-500">{agent.telephone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bouton Signalement */}
        <Link
          href="/mobile/signalement"
          className="block w-full bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4 text-center"
        >
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-semibold text-orange-700">Signaler une collecte non enregistrée</span>
          </div>
        </Link>

        {/* Dernières Collectes */}
        {recentCollectes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Dernières Collectes</h2>
              <Link href="/mobile/historique" className="text-sm text-green-600 font-medium">
                Voir tout
              </Link>
            </div>
            <div className="space-y-2">
              {recentCollectes.map((collecte) => (
                <div key={collecte.idCollecte} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">Collecte</p>
                        <p className="text-xs text-gray-500">{formatDate(collecte.dateCollecte)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatFCFA(collecte.montant)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mes Comptes */}
        {comptes.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Mes Comptes</h2>
            <div className="space-y-2">
              {comptes.map((compte) => (
                <div key={compte.numeroCompte} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{compte.numeroCompte}</p>
                        <p className="text-xs text-gray-500">Statut: {compte.statutCompte}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{formatFCFA(compte.soldeActuel)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <Link href="/mobile/dashboard" className="flex flex-col items-center justify-center py-2 text-green-600">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Accueil</span>
          </Link>
          <Link href="/mobile/historique" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Historique</span>
          </Link>
          <Link href="/mobile/signalement" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-medium">Signaler</span>
          </Link>
          <Link href="/mobile/profil" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
