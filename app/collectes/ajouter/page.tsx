'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { collecteService, CreateCollecteRequest } from '@/lib/services/collecteService';
import { compteService, Compte } from '@/lib/services/compteService';
import { agentService, Agent } from '@/lib/services/agentService';

export default function AjouterCollectePage() {
  const router = useRouter();
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateCollecteRequest>({
    compte: { numeroCompte: '' },
    agent: { idAgent: 0 },
    montant: 0,
    dateCollecte: new Date().toISOString().slice(0, 16),
    modePaiement: 'Espèces',
    preuvePhoto: '',
  });

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
      const [comptesData, agentsData] = await Promise.all([
        compteService.getAll(),
        agentService.getAll(),
      ]);
      setComptes(comptesData);
      setAgents(agentsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
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

    if (!formData.agent.idAgent) {
      setError('Veuillez sélectionner un agent');
      return;
    }

    if (formData.montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (!formData.dateCollecte) {
      setError('Veuillez sélectionner une date et heure');
      return;
    }

    try {
      setLoading(true);
      // Convertir la date au format ISO avec timezone
      const dateCollecte = new Date(formData.dateCollecte).toISOString();
      await collecteService.create({
        ...formData,
        dateCollecte,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/collectes');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la collecte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link
              href="/collectes"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold mb-4 inline-block transition-colors duration-200"
            >
              ← Retour à la liste des collectes
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Ajouter une nouvelle collecte</h1>
            <p className="mt-2 text-sm text-gray-600">
              Remplissez le formulaire ci-dessous pour enregistrer une nouvelle collecte.
            </p>
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

          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Informations de la collecte</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compte <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.compte.numeroCompte}
                  onChange={(e) => setFormData({
                    ...formData,
                    compte: { numeroCompte: e.target.value }
                  })}
                >
                  <option value="">Sélectionner un compte</option>
                  {comptes.map((compte) => (
                    <option key={compte.numeroCompte} value={compte.numeroCompte}>
                      {compte.numeroCompte} - {compte.commerçant.nomComplet} ({compte.soldeActuel.toLocaleString('fr-FR')} FCFA)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Sélectionnez le compte du commerçant pour lequel la collecte est effectuée
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.agent.idAgent}
                  onChange={(e) => setFormData({
                    ...formData,
                    agent: { idAgent: parseInt(e.target.value) }
                  })}
                >
                  <option value="0">Sélectionner un agent</option>
                  {agents.map((agent) => (
                    <option key={agent.idAgent} value={agent.idAgent}>
                      {agent.nomAgent} ({agent.codeAgent})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date et heure <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.dateCollecte}
                  onChange={(e) => setFormData({ ...formData, dateCollecte: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.modePaiement}
                  onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value as any })}
                >
                  <option value="Espèces">Espèces</option>
                  <option value="Mobile_Money">Mobile Money</option>
                  <option value="Carte_Bancaire">Carte Bancaire</option>
                  <option value="Virement">Virement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL preuve photo
                </label>
                <input
                  type="url"
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.preuvePhoto}
                  onChange={(e) => setFormData({ ...formData, preuvePhoto: e.target.value })}
                  placeholder="https://example.com/preuve.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  URL vers une photo ou un document prouvant la collecte (optionnel)
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <Link
                  href="/collectes"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création...' : 'Créer la collecte'}
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

