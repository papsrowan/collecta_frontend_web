'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { compteService, Compte } from '@/lib/services/compteService';
import { signalementService, SignalementCollecteRequest } from '@/lib/services/signalementService';
import { commerçantService } from '@/lib/services/commercantService';

export default function ClientSignalementPage() {
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
    
    if (!token) {
      router.push('/login');
      return;
    }

    // Vérifier le rôle (tolérant aux variations de casse)
    if (userRole && userRole.toUpperCase() !== 'COMMERCANT') {
      router.push('/login');
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
      // Si l'endpoint mes-comptes n'existe pas, essayer avec l'ID du commerçant
      if (err.response?.status === 404 || err.response?.status === 403) {
        try {
          const commercant = await commerçantService.getMonProfil();
          if (commercant.idCommercant) {
            const comptesData = await compteService.getByCommercant(commercant.idCommercant);
            setComptes(comptesData);
            if (comptesData.length > 0) {
              setFormData({ ...formData, numeroCompte: comptesData[0].numeroCompte });
            }
          }
        } catch (e) {
          setError('Erreur lors du chargement des comptes');
        }
      } else {
        setError('Erreur lors du chargement des comptes');
      }
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
        router.push('/client/dashboard');
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
    <div className="min-h-screen bg-gray-50 flex">
      <ClientSidebar />
      <div className="page-with-sidebar">
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Signaler une Collecte</h1>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                Signalement envoyé avec succès ! Redirection en cours...
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
              {/* Sélection du compte */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Compte <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="block w-full py-3 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Montant (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="block w-full py-3 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="0.00"
                  value={formData.montant || ''}
                  onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
                  disabled={submitting}
                />
              </div>

              {/* Date de versement */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date de versement <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full py-3 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  value={formData.dateVersement}
                  onChange={(e) => setFormData({ ...formData, dateVersement: e.target.value })}
                  disabled={submitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  className="block w-full py-3 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
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
                className="w-full flex justify-center items-center py-3 px-6 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
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
        </div>
      </div>
    </div>
  );
}
