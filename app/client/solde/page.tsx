'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compteService, Compte } from '@/lib/services/compteService';
import { collecteService, Collecte } from '@/lib/services/collecteService';

export default function ClientSoldePage() {
  const router = useRouter();
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commercantId, setCommercantId] = useState<number | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    // Récupérer l'ID du commerçant depuis le localStorage ou l'API
    // Pour l'instant, on suppose qu'il est stocké dans localStorage après la connexion
    const storedCommercantId = typeof window !== 'undefined' ? localStorage.getItem('commercantId') : null;
    if (storedCommercantId) {
      setCommercantId(parseInt(storedCommercantId));
      loadComptes(parseInt(storedCommercantId));
    } else {
      setError('ID commerçant non trouvé. Veuillez vous reconnecter.');
      setLoading(false);
    }
  }, [router]);

  const loadComptes = async (id: number) => {
    try {
      setLoading(true);
      setError('');
      const comptesData = await compteService.getByCommercant(id);
      setComptes(comptesData);
      
      // Charger les collectes pour chaque compte
      const collectesPromises = comptesData.map(compte => 
        collecteService.getByCompte(compte.numeroCompte).catch(() => [])
      );
      const allCollectes = (await Promise.all(collectesPromises)).flat();
      setCollectes(allCollectes);
    } catch (err: any) {
      console.error('Erreur lors du chargement des comptes:', err);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const totalSolde = comptes.reduce((sum, compte) => sum + compte.soldeActuel, 0);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Solde</h1>
          <p className="mt-2 text-gray-600">Consultez le solde de vos comptes et votre historique de collectes</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Carte du solde total */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h2 className="text-lg font-semibold mb-2">Solde Total</h2>
          <p className="text-4xl font-bold">{formatFCFA(totalSolde)}</p>
          <p className="mt-2 text-green-100">{comptes.length} compte(s)</p>
        </div>

        {/* Liste des comptes */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Mes Comptes</h2>
          {comptes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Aucun compte trouvé
            </div>
          ) : (
            <div className="grid gap-4">
              {comptes.map((compte) => (
                <div key={compte.numeroCompte} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{compte.numeroCompte}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Statut: <span className={`font-medium ${
                          compte.statutCompte === 'Actif' ? 'text-green-600' : 
                          compte.statutCompte === 'Bloqué' ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>{compte.statutCompte}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Ouvert le: {formatDate(compte.dateOuverture)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatFCFA(compte.soldeActuel)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique des collectes récentes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Historique des Collectes</h2>
          {collectes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Aucune collecte trouvée
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode de Paiement
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collectes.slice(0, 10).map((collecte) => (
                    <tr key={collecte.idCollecte}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(collecte.dateCollecte)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatFCFA(collecte.montant)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {collecte.modePaiement}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
