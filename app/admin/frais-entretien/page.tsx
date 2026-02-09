'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import apiClient from '@/lib/api';
import { compteService } from '@/lib/services/compteService';

interface FraisEntretienConfig {
  taux: number;
}

export default function FraisEntretienPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tauxGlobal, setTauxGlobal] = useState<number>(3.6);
  const [nouveauTauxGlobal, setNouveauTauxGlobal] = useState<string>('3.6');
  const [numeroCompte, setNumeroCompte] = useState<string>('');
  const [compteInfo, setCompteInfo] = useState<any>(null);
  const [tauxCommercant, setTauxCommercant] = useState<number | null>(null);
  const [nouveauTauxCommercant, setNouveauTauxCommercant] = useState<string>('');
  const [searchingCompte, setSearchingCompte] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadTauxGlobal();
  }, [router]);

  const loadTauxGlobal = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<FraisEntretienConfig>('/frais-entretien/taux-global');
      setTauxGlobal(response.data.taux);
      setNouveauTauxGlobal(response.data.taux.toString());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du taux global');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTauxGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const taux = parseFloat(nouveauTauxGlobal);
      if (isNaN(taux) || taux < 0 || taux > 100) {
        setError('Le taux doit être un nombre entre 0 et 100');
        return;
      }

      await apiClient.put('/frais-entretien/taux-global', { taux });
      setTauxGlobal(taux);
      setSuccess('Taux global mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du taux global');
    }
  };

  const handleRechercherCompte = async () => {
    if (!numeroCompte.trim()) {
      setError('Veuillez entrer un numéro de compte');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setSearchingCompte(true);
      
      // D'abord récupérer les informations du compte
      const compte = await compteService.getByNumero(numeroCompte);
      setCompteInfo(compte);
      
      // Ensuite récupérer le taux
      const response = await apiClient.get<FraisEntretienConfig & { commercant: string; soldeActuel: number }>(`/frais-entretien/taux-compte/${numeroCompte}`);
      setTauxCommercant(response.data.taux);
      setNouveauTauxCommercant(response.data.taux.toString());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Compte non trouvé ou erreur lors de la récupération du taux');
      setTauxCommercant(null);
      setCompteInfo(null);
    } finally {
      setSearchingCompte(false);
    }
  };

  const handleUpdateTauxCommercant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroCompte.trim()) {
      setError('Veuillez d\'abord rechercher un compte');
      return;
    }

    if (!compteInfo) {
      setError('Veuillez d\'abord rechercher le compte');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const taux = parseFloat(nouveauTauxCommercant);
      if (isNaN(taux) || taux < 0 || taux > 100) {
        setError('Le taux doit être un nombre entre 0 et 100');
        return;
      }

      await apiClient.put(`/frais-entretien/taux-compte/${numeroCompte}`, { taux });
      setTauxCommercant(taux);
      setSuccess('Taux spécifique mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du taux spécifique');
    }
  };

  const handleSupprimerTauxCommercant = async () => {
    if (!numeroCompte.trim()) {
      setError('Veuillez d\'abord rechercher un compte');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer le taux spécifique ? Le client utilisera alors le taux global.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await apiClient.delete(`/frais-entretien/taux-compte/${numeroCompte}`);
      setTauxCommercant(null);
      setNouveauTauxCommercant('');
      setSuccess('Taux spécifique supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du taux spécifique');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des Frais d'Entretien</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Configuration du taux global */}
            <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Taux Global</h2>
              <p className="text-sm text-gray-600 mb-4">
                Le taux global s'applique à tous les clients par défaut. Actuellement: <span className="font-semibold">{tauxGlobal}%</span>
              </p>
              <form onSubmit={handleUpdateTauxGlobal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau taux global (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    className="block w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="3.6"
                    value={nouveauTauxGlobal}
                    onChange={(e) => setNouveauTauxGlobal(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
                >
                  Mettre à jour le taux global
                </button>
              </form>
            </div>

            {/* Configuration du taux par client */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Taux Spécifique par Client</h2>
              <p className="text-sm text-gray-600 mb-4">
                Vous pouvez définir un taux personnalisé pour un client spécifique. Ce taux remplacera le taux global pour ce client uniquement.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de compte <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 block w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ex: COMPTE001"
                      value={numeroCompte}
                      onChange={(e) => setNumeroCompte(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleRechercherCompte())}
                    />
                    <button
                      type="button"
                      onClick={handleRechercherCompte}
                      disabled={searchingCompte}
                      className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {searchingCompte ? 'Recherche...' : 'Rechercher'}
                    </button>
                  </div>
                </div>

                {compteInfo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Commerçant:</span> {compteInfo.commerçant.nomComplet}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">Numéro de compte:</span> {compteInfo.numeroCompte}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Solde actuel:</span>{' '}
                      {Number(compteInfo.soldeActuel).toLocaleString('fr-FR')} FCFA
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCompteInfo(null);
                        setNumeroCompte('');
                        setTauxCommercant(null);
                        setNouveauTauxCommercant('');
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Changer de compte
                    </button>
                  </div>
                )}

                {compteInfo && tauxCommercant !== null && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Taux actuel pour ce client:</span> {tauxCommercant}%
                    </p>
                    <form onSubmit={handleUpdateTauxCommercant} className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nouveau taux spécifique (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          className="block w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="3.6"
                          value={nouveauTauxCommercant}
                          onChange={(e) => setNouveauTauxCommercant(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-4">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
                        >
                          Mettre à jour
                        </button>
                        <button
                          type="button"
                          onClick={handleSupprimerTauxCommercant}
                          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
                        >
                          Supprimer (utiliser le taux global)
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Information sur les prélèvements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Information sur les prélèvements</h3>
              <p className="text-sm text-blue-700">
                Les frais d'entretien sont prélevés automatiquement chaque mois le 1er jour du mois à minuit.
                Le montant prélevé est calculé en appliquant le taux (global ou spécifique) au solde actuel du compte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
