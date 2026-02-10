'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { retraitService, Retrait, CreateRetraitRequest } from '@/lib/services/retraitService';
import { compteService } from '@/lib/services/compteService';
import { generateRetraitReceiptPDF } from '@/lib/utils/pdfGenerator';

export default function RetraitsPage() {
  const router = useRouter();
  const [retraits, setRetraits] = useState<Retrait[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateRetraitRequest>({
    numeroCompte: '',
    montant: 0,
    motif: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [compteInfo, setCompteInfo] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingCompte, setSearchingCompte] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadRetraits();
  }, [router]);

  const loadRetraits = async () => {
    try {
      setLoading(true);
      const data = await retraitService.getAll();
      setRetraits(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des retraits');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCompte = async () => {
    if (!formData.numeroCompte.trim()) {
      setError('Veuillez entrer un numéro de compte');
      return;
    }

    try {
      setError('');
      setSearchingCompte(true);
      const compte = await compteService.getByNumero(formData.numeroCompte);
      setCompteInfo(compte);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Compte non trouvé avec ce numéro');
      setCompteInfo(null);
    } finally {
      setSearchingCompte(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.numeroCompte.trim()) {
      setError('Veuillez entrer un numéro de compte');
      return;
    }

    if (!compteInfo) {
      setError('Veuillez d\'abord rechercher le compte');
      return;
    }

    if (formData.montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    try {
      setSubmitting(true);
      const created = await retraitService.create(formData);
      setRetraits([created, ...retraits]);
      setShowForm(false);
      setFormData({ numeroCompte: '', montant: 0, motif: '' });
      setCompteInfo(null);
      await loadRetraits();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Erreur lors de la création du retrait');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (id: number) => {
    try {
      // Récupérer les détails du retrait
      const retrait = await retraitService.getById(id);
      // Générer le PDF côté client
      generateRetraitReceiptPDF(retrait);
    } catch (err: any) {
      setError('Erreur lors de la génération du reçu');
      console.error('Erreur génération PDF:', err);
    }
  };

  const filteredRetraits = retraits.filter((retrait) =>
    retrait.compte.numeroCompte.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (retrait.compte.commerçant && retrait.compte.commerçant.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="page-with-sidebar">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Gestion des Retraits</h1>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouveau retrait
              </button>
            </div>

            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4 flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-orange-700">{error}</p>
              </div>
            )}

            {/* Formulaire de retrait */}
            {showForm && (
              <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Nouveau Retrait</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de compte <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 block w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Ex: COMPTE001"
                        value={formData.numeroCompte}
                        onChange={(e) => setFormData({ ...formData, numeroCompte: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchCompte())}
                      />
                      <button
                        type="button"
                        onClick={handleSearchCompte}
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
                          setFormData({ ...formData, numeroCompte: '' });
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Changer de compte
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      className="block w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                      value={formData.montant || ''}
                      onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motif (Optionnel)
                    </label>
                    <textarea
                      rows={3}
                      className="block w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Raison du retrait..."
                      value={formData.motif || ''}
                      onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setFormData({ numeroCompte: '', montant: 0, motif: '' });
                        setCompteInfo(null);
                        setError('');
                        setSearchingCompte(false);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting ? 'Enregistrement...' : 'Enregistrer le retrait'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher par numéro de compte ou nom de commerçant..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Liste des retraits */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : filteredRetraits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucun retrait trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRetraits.map((retrait) => (
                  <div key={retrait.idRetrait} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-bold text-gray-800 mr-3">
                            Retrait #{retrait.idRetrait}
                          </h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                            {new Date(retrait.dateRetrait).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="space-y-1 mt-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Compte:</span> {retrait.compte.numeroCompte}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Commerçant:</span> {retrait.compte.commerçant.nomComplet}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            Montant: {Number(retrait.montant).toLocaleString('fr-FR')} FCFA
                          </p>
                          {retrait.motif && (
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Motif:</span> {retrait.motif}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Effectué par: {retrait.utilisateurCaisse.email} le{' '}
                            {new Date(retrait.dateRetrait).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleDownloadReceipt(retrait.idRetrait)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Télécharger PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

