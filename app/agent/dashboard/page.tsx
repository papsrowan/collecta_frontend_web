'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentSidebar from '@/components/AgentSidebar';
import { statistiqueService, StatistiquesAgent } from '@/lib/services/statistiqueService';
import { getCurrentAgent } from '@/lib/utils/agentUtils';
import { agentService, Agent } from '@/lib/services/agentService';

export default function AgentDashboardPage() {
  const router = useRouter();
  const [statistiques, setStatistiques] = useState<StatistiquesAgent | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
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
      
      // Charger l'agent et les statistiques en parallèle
      const [agentConnecte, stats] = await Promise.all([
        getCurrentAgent(),
        statistiqueService.getMesStatistiques(),
      ]);
      
      if (agentConnecte) {
        setAgent(agentConnecte);
      }
      
      setStatistiques(stats);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
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

  if (!statistiques) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Aucune donnée disponible'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar />
      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="mt-2 text-gray-600">
              Bienvenue, {agent?.nomAgent || statistiques.nomAgent}
            </p>
            <p className="text-sm text-gray-500">
              Code Agent: {agent?.codeAgent || statistiques.codeAgent}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Cartes statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Collecté */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Collecté</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatFCFA(statistiques.montantTotalCollecte)}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Collecté Aujourd'hui */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Collecté Aujourd'hui</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {formatFCFA(statistiques.montantCollecteAujourdhui)}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Nombre de Clients */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nombre de Clients</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {statistiques.nombreCommercantsTotal}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Nombre de Collectes */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Collectes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {statistiques.nombreCollectesTotal}
                  </p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Objectif Mensuel */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Objectif Mensuel</h2>
                <p className="text-3xl font-bold">{formatFCFA(statistiques.objectMensuel)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-100">Taux de Réalisation</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(parseFloat(statistiques.tauxRealisationObjectif))}
                </p>
              </div>
            </div>
            {/* Barre de progression */}
            <div className="w-full bg-green-700 rounded-full h-4">
              <div
                className="bg-white h-4 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, parseFloat(statistiques.tauxRealisationObjectif))}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-green-100">
              Collecté: {formatFCFA(statistiques.montantTotalCollecte)} / {formatFCFA(statistiques.objectMensuel)}
            </p>
          </div>

          {/* Statistiques du jour */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aujourd'hui</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Collectes effectuées</span>
                  <span className="text-xl font-bold text-gray-900">
                    {statistiques.nombreCollectesAujourdhui}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Montant collecté</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatFCFA(statistiques.montantCollecteAujourdhui)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nouveaux clients</span>
                  <span className="text-xl font-bold text-gray-900">
                    {statistiques.nombreCommercantsAujourdhui}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vue d'ensemble</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total collectes</span>
                  <span className="text-xl font-bold text-gray-900">
                    {statistiques.nombreCollectesTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total clients</span>
                  <span className="text-xl font-bold text-gray-900">
                    {statistiques.nombreCommercantsTotal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total collecté</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatFCFA(statistiques.montantTotalCollecte)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
