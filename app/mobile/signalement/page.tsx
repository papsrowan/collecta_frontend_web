'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { compteService, Compte } from '@/lib/services/compteService';
import { signalementService, SignalementCollecteRequest } from '@/lib/services/signalementService';

export default function MobileSignalementPage() {
  const router = useRouter();
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<SignalementCollecteRequest>({
    numeroCompte: '',
    montant: 0,
    dateVersement: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    
    if (!token || userRole !== 'Commercant') {
      router.push('/mobile/login');
      return;
    }

    loadComptes();
  }, [router]);

  const loadComptes = async () => {
    try {
      setLoading(true);
      const comptesData = await compteService.getMesComptes();
      setComptes(comptesData);
      
      // Sélectionner le premier compte par défaut
      if (comptesData.length > 0) {
        setFormData({ ...formData, numeroCompte: comptesData[0].numeroCompte });
      }
    } catch (err: any) {
      setError('Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.numeroCompte.trim()) {
      setError('Veuillez sélectionner un compte');
      return;
    }

    if (formData.montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    if (!formData.dateVersement) {
      setError('Veuillez sélectionner une date de versement');
      return;
    }

    if (!formData.description.trim()) {
      setError('Veuillez fournir une description');
      return;
    }

    try {
      setSubmitting(true);
      await signalementService.create(formData);
      setSuccess(true);
      // Réinitialiser le formulaire
      setFormData({
        numeroCompte: comptes.length > 0 ? comptes[0].numeroCompte : '',
        montant: 0,
        dateVersement: new Date().toISOString().split('T')[0],
        description: '',
      });
      setTimeout(() => {
        setSuccess(false);
        router.push('/mobile/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi du signalement');
    } finally {
      setSubmitting(false);
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
                <h1 className="text-2xl font-bold">Signaler une Collecte</h1>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 flex-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700 flex-1">Signalement envoyé avec succès !</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection du compte */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Compte <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="block w-full py-3 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base"
              value={formData.numeroCompte}
              onChange={(e) => setFormData({ ...formData, numeroCompte: e.target.value })}
              disabled={loading || submitting}
            >
              <option value="">Sélectionner un compte</option>
              {comptes.map((compte) => (
                <option key={compte.numeroCompte} value={compte.numeroCompte}>
                  {compte.numeroCompte} - {formatFCFA(compte.soldeActuel)}
                </option>
              ))}
            </select>
          </div>

          {/* Montant */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Montant (FCFA) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base"
                placeholder="0.00"
                value={formData.montant || ''}
                onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Date de versement */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date de versement <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-base"
                value={formData.dateVersement}
                onChange={(e) => setFormData({ ...formData, dateVersement: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              className="block w-full py-3 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none text-base"
              placeholder="Décrivez les circonstances du versement non enregistré..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={submitting}
            />
          </div>

          {/* Bouton d'envoi */}
          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi en cours...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Envoyer le signalement
              </>
            )}
          </button>
        </form>
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
          <Link href="/mobile/historique" className="flex flex-col items-center justify-center py-2 text-gray-600">
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Historique</span>
          </Link>
          <Link href="/mobile/signalement" className="flex flex-col items-center justify-center py-2 text-green-600">
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
