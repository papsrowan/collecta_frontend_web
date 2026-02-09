'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { compteService, Compte } from '@/lib/services/compteService';
import { collecteService, Collecte } from '@/lib/services/collecteService';
import { commerçantService } from '@/lib/services/commercantService';
import { retraitService, Retrait } from '@/lib/services/retraitService';

const formatFCFA = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XOF', 'FCFA');
};

export default function ClientHistoriquePage() {
  const router = useRouter();
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [retraits, setRetraits] = useState<Retrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [soldeTotal, setSoldeTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'collectes' | 'retraits'>('collectes');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Vérifier le rôle (tolérant aux variations de casse)
    if (userRole && userRole.toUpperCase() !== 'COMMERCANT') {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Charger le profil pour obtenir l'ID du commerçant
      const commercant = await commerçantService.getMonProfil();

      // Charger les comptes
      let comptesData: Compte[] = [];
      try {
        comptesData = await compteService.getMesComptes();
      } catch (e: any) {
        if (e.response?.status === 404 || e.response?.status === 403) {
          if (commercant.idCommercant) {
            comptesData = await compteService.getByCommercant(commercant.idCommercant);
          }
        } else {
          throw e;
        }
      }
      setComptes(comptesData);
      const total = comptesData.reduce((sum, compte) => sum + compte.soldeActuel, 0);
      setSoldeTotal(total);

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
      allCollectes.sort((a, b) => new Date(b.dateCollecte).getTime() - new Date(a.dateCollecte).getTime());
      setCollectes(allCollectes);

      // Charger les retraits
      try {
        const retraitsData = await commerçantService.getRetraits(commercant.idCommercant);
        retraitsData.sort((a: any, b: any) => new Date(b.dateRetrait).getTime() - new Date(a.dateRetrait).getTime());
        setRetraits(retraitsData);
      } catch (e) {
        console.error('Erreur lors du chargement des retraits:', e);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ClientSidebar />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
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
      <div className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Historique</h1>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Carte Solde Total */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-100">Solde Actuel Total</span>
                <svg className="w-8 h-8 text-green-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-4xl font-bold mb-1">{formatFCFA(soldeTotal)}</p>
              <p className="text-green-100 text-sm">{comptes.length} compte(s)</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md mb-6 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('collectes')}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === 'collectes'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Versements ({collectes.length})
                </button>
                <button
                  onClick={() => setActiveTab('retraits')}
                  className={`flex-1 py-4 text-center font-semibold transition-colors ${
                    activeTab === 'retraits'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Retraits ({retraits.length})
                </button>
              </div>
            </div>

            {/* Liste des transactions */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {activeTab === 'collectes' ? (
                collectes.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Aucune collecte trouvée</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {collectes.map((collecte) => (
                      <div key={collecte.idCollecte} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">Versement</p>
                              <p className="text-sm text-gray-500 truncate">{formatDate(collecte.dateCollecte)}</p>
                              <p className="text-sm text-gray-500">Compte: {collecte.compte.numeroCompte} • Mode: {collecte.modePaiement}</p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xl font-bold text-green-600">+{formatFCFA(collecte.montant)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                retraits.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p>Aucun retrait trouvé</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {retraits.map((retrait: any) => (
                      <div key={retrait.idRetrait} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                              <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">Retrait</p>
                              <p className="text-sm text-gray-500 truncate">{formatDate(retrait.dateRetrait)}</p>
                              {retrait.motif && (
                                <p className="text-sm text-gray-500">Motif: {retrait.motif}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xl font-bold text-red-600">-{formatFCFA(retrait.montant)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
