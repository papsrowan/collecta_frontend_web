'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { compteService, Compte } from '@/lib/services/compteService';
import { collecteService, Collecte } from '@/lib/services/collecteService';
import { commerçantService } from '@/lib/services/commercantService';
import { retraitService, Retrait } from '@/lib/services/retraitService';

export default function MobileHistoriquePage() {
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
    
    if (!token || userRole !== 'Commercant') {
      router.push('/mobile/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Charger les comptes
      const comptesData = await compteService.getMesComptes();
      setComptes(comptesData);
      const total = comptesData.reduce((sum, compte) => sum + compte.soldeActuel, 0);
      setSoldeTotal(total);

      // Charger le profil pour obtenir l'ID du commerçant
      const commercant = await commerçantService.getMonProfil();

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
              <Link href="/mobile/dashboard" className="inline-flex items-center mb-2">
                <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <h1 className="text-2xl font-bold">Historique</h1>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        {/* Carte Solde Total */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Solde Actuel Total</span>
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{formatFCFA(soldeTotal)}</p>
          <p className="text-xs text-gray-500">{comptes.length} compte(s)</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('collectes')}
              className={`flex-1 py-3 text-center font-semibold transition-colors ${
                activeTab === 'collectes'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600'
              }`}
            >
              Versements ({collectes.length})
            </button>
            <button
              onClick={() => setActiveTab('retraits')}
              className={`flex-1 py-3 text-center font-semibold transition-colors ${
                activeTab === 'retraits'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600'
              }`}
            >
              Retraits ({retraits.length})
            </button>
          </div>
        </div>

        {/* Liste des transactions */}
        <div className="space-y-2">
          {activeTab === 'collectes' ? (
            collectes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Aucune collecte trouvée</p>
              </div>
            ) : (
              collectes.map((collecte) => (
                <div key={collecte.idCollecte} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">Versement</p>
                        <p className="text-xs text-gray-500 truncate">{formatDate(collecte.dateCollecte)}</p>
                        <p className="text-xs text-gray-500">Compte: {collecte.compte.numeroCompte}</p>
                        <p className="text-xs text-gray-500">Mode: {collecte.modePaiement}</p>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-xl font-bold text-green-600">+{formatFCFA(collecte.montant)}</p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            retraits.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">Aucun retrait trouvé</p>
              </div>
            ) : (
              retraits.map((retrait: any) => (
                <div key={retrait.idRetrait} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                        <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">Retrait</p>
                        <p className="text-xs text-gray-500 truncate">{formatDate(retrait.dateRetrait)}</p>
                        {retrait.motif && (
                          <p className="text-xs text-gray-500">Motif: {retrait.motif}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-xl font-bold text-red-600">-{formatFCFA(retrait.montant)}</p>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* Navigation Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <Link href="/mobile/dashboard" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Accueil</span>
          </Link>
          <Link href="/mobile/historique" className="flex flex-col items-center justify-center py-2 text-green-600">
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
