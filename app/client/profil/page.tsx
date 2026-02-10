'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { commerçantService, Commercant } from '@/lib/services/commercantService';
import { fraisEntretienService } from '@/lib/services/fraisEntretienService';
import { authService } from '@/lib/auth';

const formatFCFA = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XOF', 'FCFA');
};

export default function ClientProfilPage() {
  const router = useRouter();
  const [commercant, setCommercant] = useState<Commercant | null>(null);
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tauxEntretien, setTauxEntretien] = useState<number | null>(null);
  const [soldeTotal, setSoldeTotal] = useState<number | null>(null);
  const [nombreComptes, setNombreComptes] = useState<number | null>(null);

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

    loadProfileData();
  }, [router]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError('');

      // Charger le profil du commerçant
      const commercantData = await commerçantService.getMonProfil();
      setCommercant(commercantData);

      // Récupérer l'email depuis localStorage
      const userInfo = typeof window !== 'undefined' ? localStorage.getItem('userInfo') : null;
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          setEmail(parsed.email || '');
        } catch (e) {
          // Si pas d'email dans userInfo, essayer depuis le token
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              setEmail(payload.sub || '');
            } catch (e2) {
              console.error('Erreur lors du décodage du token:', e2);
            }
          }
        }
      }

      // Charger le taux d'entretien et les informations financières
      try {
        const tauxData = await fraisEntretienService.getMonTaux();
        setTauxEntretien(tauxData.taux);
        setSoldeTotal(tauxData.soldeTotal);
        setNombreComptes(tauxData.nombreComptes);
      } catch (e) {
        console.error('Erreur lors du chargement du taux d\'entretien:', e);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      authService.logout();
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <ClientSidebar />
        <div className="page-with-sidebar flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ClientSidebar />
      <div className="page-with-sidebar">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Mon Profil</h1>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Photo de profil */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>

            {/* Nom */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{commercant?.nomComplet || 'Client'}</h2>
              <p className="text-gray-600 text-sm">{email || 'Non disponible'}</p>
            </div>

            {/* Informations Financières */}
            {(tauxEntretien !== null || soldeTotal !== null) && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Informations Financières</h3>
                <div className="space-y-4">
                  {tauxEntretien !== null && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-700">Taux d'entretien mensuel</span>
                      </div>
                      <span className="text-base font-bold text-orange-700">{tauxEntretien.toFixed(2)}%</span>
                    </div>
                  )}
                  {soldeTotal !== null && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-700">Solde total</span>
                      </div>
                      <span className="text-base font-bold text-green-700">{formatFCFA(soldeTotal)}</span>
                    </div>
                  )}
                  {nombreComptes !== null && (
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-sm text-gray-700">Nombre de comptes</span>
                      </div>
                      <span className="text-base font-bold text-blue-700">{nombreComptes} compte(s)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Informations Personnelles */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Informations Personnelles</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-7a2 2 0 01-2-2v-8.586a1 1 0 00-.293-.707l-4-4A1 1 0 016 7v6a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 00-2-2H9" />
                    </svg>
                    <span className="text-sm text-gray-700">Téléphone</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{commercant?.telephone || 'Non disponible'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span className="text-sm text-gray-700">Email</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate ml-2">{email || 'Non disponible'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">Zone de collecte</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{commercant?.zoneCollecte || 'Non disponible'}</span>
                </div>
                {commercant?.nomBoutique && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm text-gray-700">Nom de la boutique</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{commercant.nomBoutique}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de déconnexion */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center justify-center text-red-700 font-semibold hover:bg-red-100 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
