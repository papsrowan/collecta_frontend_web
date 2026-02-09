'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { kycService, KYC } from '@/lib/services/kycService';

export default function KYCPage() {
  const router = useRouter();
  const [kycs, setKycs] = useState<KYC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'valides' | 'rejetes'>('en_attente');

  useEffect(() => {
    loadKYCs();
  }, [filter]);

  const loadKYCs = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: KYC[];
      
      if (filter === 'en_attente') {
        data = await kycService.getEnAttente();
      } else {
        data = await kycService.getAll();
      }
      
      setKycs(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des KYC');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[statut as keyof typeof styles]}`}>
        {labels[statut as keyof typeof labels]}
      </span>
    );
  };

  const filteredKycs = filter === 'all' 
    ? kycs 
    : filter === 'en_attente'
    ? kycs.filter(k => k.statutValidation === 'EN_ATTENTE')
    : filter === 'valides'
    ? kycs.filter(k => k.statutValidation === 'VALIDE')
    : kycs.filter(k => k.statutValidation === 'REJETE');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des KYC</h1>
          <p className="text-gray-600">Validez ou rejetez les documents d'identité des commerçants</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter('en_attente')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'en_attente'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-300'
            }`}
          >
            En attente ({kycs.filter(k => k.statutValidation === 'EN_ATTENTE').length})
          </button>
          <button
            onClick={() => setFilter('valides')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'valides'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-300'
            }`}
          >
            Validés ({kycs.filter(k => k.statutValidation === 'VALIDE').length})
          </button>
          <button
            onClick={() => setFilter('rejetes')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'rejetes'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-red-50 border border-gray-300'
            }`}
          >
            Rejetés ({kycs.filter(k => k.statutValidation === 'REJETE').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-gray-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Tous ({kycs.length})
          </button>
        </div>

        {/* Liste des KYC */}
        {filteredKycs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">Aucun KYC {filter === 'en_attente' ? 'en attente' : filter === 'valides' ? 'validé' : filter === 'rejetes' ? 'rejeté' : ''}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredKycs.map((kyc) => (
              <div
                key={kyc.idKyc}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/kyc/${kyc.idKyc}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {kyc.commerçant.nomComplet}
                    </h3>
                    {kyc.commerçant.nomBoutique && (
                      <p className="text-gray-600 text-sm mb-1">{kyc.commerçant.nomBoutique}</p>
                    )}
                    <p className="text-gray-500 text-sm">
                      {kyc.commerçant.telephone} • {kyc.commerçant.zoneCollecte}
                    </p>
                  </div>
                  {getStatusBadge(kyc.statutValidation)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Type de document</p>
                    <p className="font-medium text-gray-800">{kyc.typeDocument}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Numéro de pièce</p>
                    <p className="font-medium text-gray-800">{kyc.numeroPiece}</p>
                  </div>
                </div>

                {kyc.dateValidation && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      Validé le: {new Date(kyc.dateValidation).toLocaleDateString('fr-FR', {
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
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Commentaire:</span> {kyc.commentaireValidation}
                    </p>
                  </div>
                )}

                {kyc.statutValidation === 'EN_ATTENTE' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/kyc/${kyc.idKyc}`);
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Examiner et valider
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

