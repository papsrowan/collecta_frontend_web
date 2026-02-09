'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { kycService, KYC, ValidationKYCRequest } from '@/lib/services/kycService';

export default function KYCDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const [kyc, setKyc] = useState<KYC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<'VALIDE' | 'REJETE' | null>(null);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    if (id) {
      loadKYC();
    }
  }, [id]);

  const loadKYC = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await kycService.getById(id);
      setKyc(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du KYC');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async () => {
    if (!validationAction || !kyc) return;

    try {
      setValidating(true);
      setError(null);

      const request: ValidationKYCRequest = {
        statutValidation: validationAction,
        commentaire: commentaire.trim() || undefined,
      };

      await kycService.valider(kyc.idKyc, request);
      router.push('/kyc');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
      console.error('Erreur:', err);
    } finally {
      setValidating(false);
      setShowValidationModal(false);
      setCommentaire('');
      setValidationAction(null);
    }
  };

  const openValidationModal = (action: 'VALIDE' | 'REJETE') => {
    setValidationAction(action);
    setShowValidationModal(true);
  };

  const getStatusBadge = (statut: string) => {
    const styles = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      VALIDE: 'bg-green-100 text-green-800 border-green-300',
      REJETE: 'bg-red-100 text-red-800 border-red-300',
    };
    
    const labels = {
      EN_ATTENTE: 'En attente',
      VALIDE: 'Validé',
      REJETE: 'Rejeté',
    };

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !kyc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
          <button
            onClick={() => router.push('/kyc')}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  if (!kyc) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push('/kyc')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la liste
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Détails du KYC</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                {kyc.commerçant.nomComplet}
              </h2>
              {kyc.commerçant.nomBoutique && (
                <p className="text-gray-600 mb-1">{kyc.commerçant.nomBoutique}</p>
              )}
              <p className="text-gray-500">
                {kyc.commerçant.telephone} • {kyc.commerçant.zoneCollecte}
              </p>
            </div>
            {getStatusBadge(kyc.statutValidation)}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Type de document</p>
              <p className="font-medium text-gray-800 text-lg">{kyc.typeDocument}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Numéro de pièce</p>
              <p className="font-medium text-gray-800 text-lg">{kyc.numeroPiece}</p>
            </div>
          </div>

          {kyc.dateValidation && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Date de validation</p>
              <p className="font-medium text-gray-800">
                {new Date(kyc.dateValidation).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {kyc.commentaireValidation && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Commentaire</p>
              <p className="text-gray-800">{kyc.commentaireValidation}</p>
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Photo Recto</h3>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={kyc.photoRectoUrl}
                alt="Photo recto"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Photo Verso</h3>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={kyc.photoVersoUrl}
                alt="Photo verso"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {kyc.statutValidation === 'EN_ATTENTE' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
            <div className="flex gap-4">
              <button
                onClick={() => openValidationModal('VALIDE')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Valider
              </button>
              <button
                onClick={() => openValidationModal('REJETE')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Rejeter
              </button>
            </div>
          </div>
        )}

        {/* Modal de validation */}
        {showValidationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {validationAction === 'VALIDE' ? 'Valider le KYC' : 'Rejeter le KYC'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                  rows={4}
                  placeholder="Ajoutez un commentaire..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    setCommentaire('');
                    setValidationAction(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                  disabled={validating}
                >
                  Annuler
                </button>
                <button
                  onClick={handleValidation}
                  disabled={validating}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    validationAction === 'VALIDE'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50`}
                >
                  {validating ? 'Traitement...' : validationAction === 'VALIDE' ? 'Valider' : 'Rejeter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

