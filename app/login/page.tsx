'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginRequest } from '@/lib/auth';
import { generateBicecReceiptPDF } from '@/lib/utils/pdfGenerator';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials: LoginRequest = { email, password };
      const response = await authService.login(credentials);
      
      // Vérifier que le token existe dans la réponse
      if (!response || !response.token) {
        setError('Réponse invalide du serveur. Vérifiez que le serveur est démarré.');
        return;
      }
      
      // Stocker le token et vérifier qu'il est bien stocké
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.token);
        console.log('DEBUG Login: Token stocké dans localStorage:', response.token.substring(0, 20) + '...');
        
        // Stocker le rôle et les infos utilisateur si disponibles
        if (response.role) {
          // Normaliser le rôle en majuscules
          localStorage.setItem('userRole', response.role.toUpperCase());
          console.log('DEBUG Login: Rôle stocké:', response.role.toUpperCase());
        }
        if (response.userInfo) {
          localStorage.setItem('userInfo', JSON.stringify(response.userInfo));
          if (response.userInfo.idCommercant) {
            localStorage.setItem('commercantId', response.userInfo.idCommercant.toString());
          }
        }
        
        // Vérifier que le token est bien stocké avant de rediriger
        const storedToken = localStorage.getItem('token');
        if (!storedToken || storedToken !== response.token) {
          console.error('DEBUG Login: ERREUR - Le token n\'a pas été correctement stocké!');
          setError('Erreur lors du stockage du token. Veuillez réessayer.');
          return;
        }
        console.log('DEBUG Login: Token vérifié dans localStorage avant redirection');
      }

      // Attendre un peu pour s'assurer que localStorage est bien mis à jour
      await new Promise(resolve => setTimeout(resolve, 300));

      // Vérifier une dernière fois que le token est bien stocké
      const finalTokenCheck = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!finalTokenCheck || finalTokenCheck !== response.token) {
        console.error('DEBUG Login: ⚠️ ERREUR CRITIQUE - Le token n\'est pas correctement stocké avant la redirection!');
        setError('Erreur lors du stockage du token. Veuillez réessayer.');
        return;
      }
      console.log('DEBUG Login: ✅ Token vérifié une dernière fois avant redirection');

      // Rediriger selon le rôle (tolérant aux variations de casse)
      const role = response.role?.toUpperCase();
      console.log('DEBUG Login: Redirection vers le dashboard pour le rôle:', role);
      if (role === 'AGENT') {
        router.replace('/agent/dashboard');
      } else if (role === 'COMMERCANT') {
        // Rediriger vers l'interface web pour les clients
        console.log('DEBUG Login: Redirection vers /client/dashboard');
        router.replace('/client/dashboard');
      } else if (role === 'ADMIN') {
        router.replace('/dashboard');
      } else if (role === 'CAISSE') {
        router.replace('/retraits');
      } else {
        // Par défaut, rediriger vers le tableau de bord admin
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('❌ Erreur de connexion:', err);
      console.error('❌ Détails de l\'erreur:', err.response?.data);
      console.error('❌ Status code:', err.response?.status);
      console.error('❌ Message:', err.message);
      
      let errorMessage = 'Erreur de connexion. Vérifiez vos identifiants et que le serveur est démarré.';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Gérer les erreurs de validation
        if (data.errors && typeof data.errors === 'object') {
          const validationErrors = Object.entries(data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          errorMessage = `Erreurs de validation: ${validationErrors}`;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Si c'est une erreur réseau, donner un message plus spécifique
      if (!err.response) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le serveur Spring Boot est démarré.';
      }
      
      console.error('❌ Message d\'erreur final:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            Connexion
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Collecte Journalière - Administration
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-start">
                <svg className="w-5 h-5 text-orange-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-orange-700">{error}</p>
              </div>
            )}
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Ex: admin@collecte.cm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => generateBicecReceiptPDF()}
                className="w-full flex justify-center items-center py-3 px-4 border border-red-600 text-base font-semibold rounded-xl text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Télécharger Reçu PDF
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

