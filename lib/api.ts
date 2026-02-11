import axios from 'axios';

// Base URL du backend (sans /api) ; on ajoute /api pour matcher les controllers Spring Boot
const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://187.77.97.150:8080').replace(/\/$/, '');
const API_BASE_URL = `${BASE}/api`;

// Configuration de l'instance axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    // Toujours essayer d'ajouter le token, même en SSR (pour les requêtes côté client)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('token')?.trim();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('DEBUG API: Token ajouté à la requête', config.url, 'Token:', token.substring(0, 20) + '...');
        } else {
          console.warn('DEBUG API: ⚠️ Aucun token trouvé dans localStorage pour la requête', config.url);
          console.warn('DEBUG API: localStorage.getItem("token"):', localStorage.getItem('token'));
        }
      } else {
        console.warn('DEBUG API: ⚠️ window ou localStorage n\'est pas disponible (SSR?) pour la requête', config.url);
      }
    } catch (error) {
      console.error('DEBUG API: Erreur lors de l\'ajout du token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gérer les erreurs de connexion au serveur
    if (!error.response) {
      // Pas de réponse du serveur (serveur non démarré, problème réseau, CORS, etc.)
      console.error('Erreur de connexion au serveur:', error.message);
      console.error('URL de l\'API configurée:', API_BASE_URL);
      console.error('Vérifiez que:');
      console.error('1. Le serveur Spring Boot est démarré sur', API_BASE_URL);
      console.error('2. L\'URL est correcte dans le fichier .env.local');
      console.error('3. Le serveur Spring Boot accepte les connexions CORS depuis votre navigateur');
      
      // Améliorer le message d'erreur pour l'utilisateur
      const enhancedError = new Error(
        `Impossible de contacter le serveur Spring Boot.\n` +
        `URL configurée: ${API_BASE_URL}\n\n` +
        `Vérifiez que:\n` +
        `1. Le serveur Spring Boot est démarré\n` +
        `2. L'URL dans .env.local est correcte\n` +
        `3. Le serveur accepte les connexions CORS\n` +
        `4. Aucun pare-feu ne bloque la connexion`
      );
      (enhancedError as any).isNetworkError = true;
      return Promise.reject(enhancedError);
    }
    
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      // Ne PAS rediriger automatiquement - laisser les composants gérer la redirection
      // pour éviter les redirections intempestives lors du chargement initial
      console.warn('DEBUG API: Erreur 401 détectée, mais pas de redirection automatique');
      console.warn('DEBUG API: Path actuel:', typeof window !== 'undefined' ? window.location.pathname : 'N/A');
      
      // Ne pas nettoyer le localStorage ici - laisser les composants le faire
      // pour éviter de perdre le token si c'est juste une requête qui échoue temporairement
    } else if (error.response?.status === 403) {
      const data = error.response?.data;
      if (data?.error === 'MICROFINANCE_DESACTIVEE') {
        // Microfinance désactivée ou non à jour : déconnexion et redirection vers login avec message
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('commercantId');
          sessionStorage.setItem(
            'loginBlockedMessage',
            typeof data.message === 'string' ? data.message : 'L\'accès au système est suspendu pour votre microfinance. Merci de régulariser votre situation.'
          );
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      console.error('Accès refusé: Vous n\'avez pas les permissions nécessaires pour cette action');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

