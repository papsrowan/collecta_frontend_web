'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { signalementService, SignalementCollecte } from '@/lib/services/signalementService';

export default function SignalementsPage() {
  const router = useRouter();
  const [signalements, setSignalements] = useState<SignalementCollecte[]>([]);
  const [filteredSignalements, setFilteredSignalements] = useState<SignalementCollecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatut, setFilterStatut] = useState<'all' | 'En_attente' | 'Traité' | 'Rejeté'>('all');
  const [selectedSignalement, setSelectedSignalement] = useState<SignalementCollecte | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadSignalements();
  }, [router]);

  useEffect(() => {
    if (filterStatut === 'all') {
      setFilteredSignalements(signalements);
    } else {
      setFilteredSignalements(signalements.filter(s => s.statut === filterStatut));
    }
  }, [filterStatut, signalements]);

  const loadSignalements = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await signalementService.getAll();
      // Trier par date de signalement (plus récent en premier)
      const sorted = data.sort((a, b) => {
        const dateA = a.dateSignalement ? new Date(a.dateSignalement).getTime() : 0;
        const dateB = b.dateSignalement ? new Date(b.dateSignalement).getTime() : 0;
        return dateB - dateA;
      });
      setSignalements(sorted);
      setFilteredSignalements(sorted);
    } catch (err: any) {
      console.error('Erreur lors du chargement des signalements:', err);
      setError('Erreur lors du chargement des signalements. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatut = async (id: number, nouveauStatut: 'En_attente' | 'Traité' | 'Rejeté') => {
    try {
      await signalementService.updateStatut(id, nouveauStatut);
      await loadSignalements();
      setSelectedSignalement(null);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      alert('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Traité':
        return 'bg-green-100 text-green-800';
      case 'Rejeté':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: signalements.length,
    en_attente: signalements.filter(s => s.statut === 'En_attente').length,
    traité: signalements.filter(s => s.statut === 'Traité').length,
    rejeté: signalements.filter(s => s.statut === 'Rejeté').length,
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
      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Signalements de Collectes</h1>
            <p className="mt-2 text-gray-600">Gérez les signalements de collectes non enregistrées</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
              <p className="text-sm text-yellow-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.en_attente}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
              <p className="text-sm text-green-600">Traité</p>
              <p className="text-2xl font-bold text-green-800">{stats.traité}</p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
              <p className="text-sm text-red-600">Rejeté</p>
              <p className="text-2xl font-bold text-red-800">{stats.rejeté}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par statut:</label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value as any)}
              className="block w-64 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">Tous</option>
              <option value="En_attente">En Attente</option>
              <option value="Traité">Traité</option>
              <option value="Rejeté">Rejeté</option>
            </select>
          </div>

          {/* Liste des signalements */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredSignalements.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Aucun signalement trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Signalement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commerçant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro Compte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Versement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSignalements.map((signalement) => (
                      <tr key={signalement.idSignalement} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(signalement.dateSignalement)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {signalement.commerçant.nomComplet}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {signalement.numeroCompte}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(signalement.dateVersement)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatFCFA(signalement.montant)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatutColor(signalement.statut)}`}>
                            {signalement.statut}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedSignalement(signalement)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Détails
                          </button>
                          {signalement.statut === 'En_attente' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatut(signalement.idSignalement!, 'Traité')}
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                Traiter
                              </button>
                              <button
                                onClick={() => handleUpdateStatut(signalement.idSignalement!, 'Rejeté')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal de détails amélioré */}
          {selectedSignalement && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Détails du Signalement</h3>
                  <button
                    onClick={() => setSelectedSignalement(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {/* Informations principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-blue-600 uppercase mb-1">Commerçant</p>
                      <p className="text-base font-semibold text-gray-900">{selectedSignalement.commerçant.nomComplet}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-green-600 uppercase mb-1">Montant</p>
                      <p className="text-lg font-bold text-green-700">{formatFCFA(selectedSignalement.montant)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-600 uppercase mb-1">Numéro de Compte</p>
                      <p className="text-base font-semibold text-gray-900">{selectedSignalement.numeroCompte}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs font-medium text-purple-600 uppercase mb-1">Statut</p>
                      <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatutColor(selectedSignalement.statut)}`}>
                        {selectedSignalement.statut}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Dates</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date de Versement</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedSignalement.dateVersement)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Date de Signalement</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(selectedSignalement.dateSignalement)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSignalement.description || 'Aucune description fournie'}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedSignalement.statut === 'En_attente' && (
                    <div className="border-t border-gray-200 pt-4 flex gap-3">
                      <button
                        onClick={() => {
                          handleUpdateStatut(selectedSignalement.idSignalement!, 'Traité');
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Marquer comme Traité
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatut(selectedSignalement.idSignalement!, 'Rejeté');
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
