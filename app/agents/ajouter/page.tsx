'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { agentService, CreateAgentRequest } from '@/lib/services/agentService';
import { utilisateurService, User } from '@/lib/services/utilisateurService';

export default function AjouterAgentPage() {
  const router = useRouter();
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateAgentRequest>({
    idUtilisateur: 0,
    nomAgent: '',
    telephone: '',
    zoneAffectation: '',
    objectMensuelFcfa: 0,
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadUtilisateurs();
  }, [router]);

  const loadUtilisateurs = async () => {
    try {
      const usersData = await utilisateurService.getAll();
      // Filtrer uniquement les utilisateurs avec le rôle Agent qui n'ont pas encore d'agent associé
      setUtilisateurs(usersData.filter(u => u.role === 'Agent'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.idUtilisateur) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }

    if (!formData.nomAgent.trim()) {
      setError('Le nom de l\'agent est obligatoire');
      return;
    }

    if (!formData.telephone.trim()) {
      setError('Le téléphone est obligatoire');
      return;
    }

    if (!formData.zoneAffectation.trim()) {
      setError('La zone d\'affectation est obligatoire');
      return;
    }

    if (formData.objectMensuelFcfa < 0) {
      setError('L\'objectif mensuel ne peut pas être négatif');
      return;
    }

    try {
      setLoading(true);
      await agentService.create(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/agents');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="page-with-sidebar">
        <div className="max-w-3xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Link
              href="/agents"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold mb-4 inline-block transition-colors duration-200"
            >
              ← Retour à la liste des agents
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Ajouter un nouvel agent</h1>
            <p className="text-sm text-gray-600">
              Remplissez le formulaire ci-dessous pour créer un nouveau profil agent. Le code agent sera généré automatiquement.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
              <p className="font-medium">✅ Agent créé avec succès ! Redirection en cours...</p>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-green-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Informations de l'agent</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Utilisateur <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.idUtilisateur}
                  onChange={(e) => setFormData({ ...formData, idUtilisateur: parseInt(e.target.value) })}
                >
                    <option value="0" className="text-gray-500">Sélectionner un utilisateur</option>
                  {utilisateurs.map((user) => (
                    <option key={user.idUtilisateur} value={user.idUtilisateur} className="text-gray-900 font-medium">
                      {user.email} {user.statutUtilisateur === 'Bloqué' ? '(Bloqué)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Sélectionnez un utilisateur avec le rôle "Agent". Créez d'abord l'utilisateur si nécessaire.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.nomAgent}
                  onChange={(e) => setFormData({ ...formData, nomAgent: e.target.value })}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="Ex: +237 6XX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Zone d'affectation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.zoneAffectation}
                  onChange={(e) => setFormData({ ...formData, zoneAffectation: e.target.value })}
                  placeholder="Ex: Douala Centre"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Objectif mensuel (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.objectMensuelFcfa}
                  onChange={(e) => setFormData({ ...formData, objectMensuelFcfa: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Montant en FCFA que l'agent doit collecter chaque mois
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-indigo-200">
                <Link
                  href="/agents"
                  className="px-6 py-3 border-2 border-indigo-300 rounded-lg text-indigo-700 font-semibold hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {loading ? 'Création...' : 'Créer l\'agent'}
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

