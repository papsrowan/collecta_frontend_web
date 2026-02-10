'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { statistiqueService, StatistiquesGlobales } from '@/lib/services/statistiqueService';

export default function DashboardPage() {
  const router = useRouter();
  const [statistiquesGlobales, setStatistiquesGlobales] = useState<StatistiquesGlobales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole')?.toUpperCase() : null;
    if (!token) {
      router.push('/login');
      return;
    }
    if (role === 'SUPERADMIN') {
      router.replace('/super-admin/dashboard');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const globalesData = await statistiqueService.getStatistiquesGlobales();
      setStatistiquesGlobales(globalesData);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="page-with-sidebar">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!statistiquesGlobales) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="page-with-sidebar">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <p className="text-gray-600">Aucune donnée disponible</p>
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
        <div className="max-w-7xl mx-auto">
          <div>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de l'activité</p>
            </div>

            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4 flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-orange-700">{error}</p>
              </div>
            )}

            {/* Cartes principales */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Montant total collecté */}
              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total versements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFCFA(statistiquesGlobales.montantTotalCollecte)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {statistiquesGlobales.nombreCollectesTotal.toLocaleString('fr-FR')} collecte(s)
                    </p>
                  </div>
                  <div className="text-green-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Montant total retiré */}
              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total retraits</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFCFA(statistiquesGlobales.montantTotalRetrait)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {statistiquesGlobales.nombreRetraitsTotal.toLocaleString('fr-FR')} retrait(s)
                    </p>
                  </div>
                  <div className="text-red-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Frais d'entretien perçus */}
              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Frais d'entretien</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFCFA(statistiquesGlobales.montantTotalFraisEntretien)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFCFA(statistiquesGlobales.montantFraisEntretienCeMois)} ce mois
                    </p>
                  </div>
                  <div className="text-purple-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Solde total des comptes */}
              <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Solde total comptes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatFCFA(statistiquesGlobales.soldeTotalComptes)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {statistiquesGlobales.nombreComptesActifs} compte(s) actif(s)
                    </p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Cartes secondaires */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Versements aujourd'hui */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Versements aujourd'hui</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatFCFA(statistiquesGlobales.montantCollecteAujourdhui)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {statistiquesGlobales.nombreCollectesAujourdhui} collecte(s)
                    </p>
                  </div>
                  <div className="text-green-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Retraits aujourd'hui */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Retraits aujourd'hui</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatFCFA(statistiquesGlobales.montantRetraitAujourdhui)}
                    </p>
                  </div>
                  <div className="text-red-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Commerçants */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Commerçants</p>
                    <p className="text-xl font-bold text-gray-900">
                      {statistiquesGlobales.nombreCommercantsTotal.toLocaleString('fr-FR')}
                    </p>
                    {statistiquesGlobales.nombreCommercantsAujourdhui > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        +{statistiquesGlobales.nombreCommercantsAujourdhui} aujourd'hui
                      </p>
                    )}
                  </div>
                  <div className="text-blue-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Agents actifs */}
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Agents actifs</p>
                    <p className="text-xl font-bold text-gray-900">
                      {statistiquesGlobales.nombreAgentsActifs} / {statistiquesGlobales.nombreAgentsTotal}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Agents actifs
                    </p>
                  </div>
                  <div className="text-indigo-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Résumé financier */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Résumé financier</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-2">Revenus totaux</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatFCFA(statistiquesGlobales.montantTotalCollecte)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Total des versements</p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-5 border border-red-200">
                  <p className="text-sm text-red-700 font-medium mb-2">Sorties totales</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatFCFA(statistiquesGlobales.montantTotalRetrait + statistiquesGlobales.montantTotalFraisEntretien)}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Retraits: {formatFCFA(statistiquesGlobales.montantTotalRetrait)} + 
                    Frais: {formatFCFA(statistiquesGlobales.montantTotalFraisEntretien)}
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-2">Bénéfice net</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatFCFA(
                      statistiquesGlobales.montantTotalCollecte - 
                      statistiquesGlobales.montantTotalRetrait - 
                      statistiquesGlobales.montantTotalFraisEntretien
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Revenus - Sorties</p>
                </div>
              </div>
            </div>

            {/* Informations sur les comptes */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Informations sur les comptes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Comptes actifs</p>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {statistiquesGlobales.nombreComptesActifs} / {statistiquesGlobales.nombreComptesTotal}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(statistiquesGlobales.nombreComptesActifs / statistiquesGlobales.nombreComptesTotal) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">Solde moyen par compte</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistiquesGlobales.nombreComptesTotal > 0
                      ? formatFCFA(statistiquesGlobales.soldeTotalComptes / statistiquesGlobales.nombreComptesTotal)
                      : formatFCFA(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {statistiquesGlobales.nombreComptesTotal} compte(s) au total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
