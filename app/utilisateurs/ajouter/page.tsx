'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { utilisateurService, CreateUtilisateurRequest } from '@/lib/services/utilisateurService';

export default function AjouterUtilisateurPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<CreateUtilisateurRequest>({
    email: '',
    motDePasseHash: '',
    role: 'Agent',
    statutUtilisateur: 'Actif',
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.email.trim()) {
      setError('L\'email est obligatoire');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Veuillez entrer un email valide');
      return;
    }

    if (!formData.motDePasseHash || formData.motDePasseHash.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      setLoading(true);
      await utilisateurService.create(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/utilisateurs');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-3xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Link
              href="/utilisateurs"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold mb-4 inline-block transition-colors duration-200"
            >
              ← Retour à la liste des utilisateurs
            </Link>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Ajouter un nouvel utilisateur</h1>
            <p className="text-sm text-gray-600">
              Remplissez le formulaire ci-dessous pour créer un nouveau compte utilisateur.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
              <p className="font-medium">✅ Utilisateur créé avec succès ! Redirection en cours...</p>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Informations de l'utilisateur</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemple@collecte.cm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.motDePasseHash}
                  onChange={(e) => setFormData({ ...formData, motDePasseHash: e.target.value })}
                  placeholder="Minimum 8 caractères"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Admin' | 'Agent' | 'Caisse' | 'Commercant' })}
                >
                  <option value="Admin" className="text-gray-900">Admin</option>
                  <option value="Agent" className="text-gray-900">Agent</option>
                  <option value="Caisse" className="text-gray-900">Caissier</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Les administrateurs ont accès à toutes les fonctionnalités. Les agents peuvent créer des clients et faire des collectes. Les caissiers peuvent effectuer des versements et des retraits.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Statut <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border-2 border-indigo-200 rounded-lg shadow-sm py-3 px-4 text-gray-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={formData.statutUtilisateur}
                  onChange={(e) => setFormData({ ...formData, statutUtilisateur: e.target.value as 'Actif' | 'Bloqué' })}
                >
                  <option value="Actif" className="text-gray-900">Actif</option>
                  <option value="Bloqué" className="text-gray-900">Bloqué</option>
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  Un utilisateur bloqué ne pourra pas se connecter à l'application
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-indigo-200">
                <Link
                  href="/utilisateurs"
                  className="px-6 py-3 border-2 border-indigo-300 rounded-lg text-indigo-700 font-semibold hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white font-semibold rounded-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {loading ? 'Création...' : 'Créer l\'utilisateur'}
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

