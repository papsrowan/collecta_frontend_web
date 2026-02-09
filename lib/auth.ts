import apiClient from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type?: string;
  message?: string;
  role?: string;
  userInfo?: {
    idAgent?: number;
    nomAgent?: string;
    codeAgent?: string;
    idCommercant?: number;
    nomComplet?: string;
  };
}

export interface User {
  idUtilisateur: number;
  email: string;
  role: 'Admin' | 'Agent' | 'Caisse' | 'Commercant';
  statutUtilisateur: 'Actif' | 'Bloqué';
  dateCreation: string;
  createdBy?: {
    idUtilisateur: number;
    email: string;
  };
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      
      // Vérifier que la réponse contient un token
      if (!response.data || !response.data.token) {
        throw new Error('Token manquant dans la réponse du serveur');
      }
      
      return response.data;
    } catch (error: any) {
      // Améliorer le message d'erreur
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur
        const status = error.response.status;
        const data = error.response.data;
        
        // Si c'est une erreur 400, essayer d'extraire les détails de validation
        if (status === 400) {
          let errorMessage = data?.message || 'Erreur de validation';
          
          // Si c'est une erreur de validation Spring Boot, extraire les détails
          if (data?.errors && typeof data.errors === 'object') {
            // Les erreurs sont dans un objet avec les noms de champs comme clés
            const validationErrors = Object.entries(data.errors)
              .map(([field, message]) => `${field}: ${message}`)
              .join(', ');
            errorMessage = `Erreurs de validation: ${validationErrors}`;
          } else if (data?.errors && Array.isArray(data.errors)) {
            const validationErrors = data.errors
              .map((err: any) => err.defaultMessage || err.message)
              .join(', ');
            errorMessage = `Erreurs de validation: ${validationErrors}`;
          } else if (typeof data === 'string') {
            errorMessage = data;
          } else if (data?.error) {
            errorMessage = data.error;
          }
          
          const enhancedError = new Error(errorMessage);
          (enhancedError as any).response = error.response;
          throw enhancedError;
        }
        
        throw error;
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.10.4:8080/api';
        throw new Error(`Impossible de contacter le serveur Spring Boot.\n\nURL configurée: ${apiUrl}\n\nVérifiez que:\n1. Le serveur Spring Boot est démarré\n2. L'URL dans .env.local est correcte (actuellement: ${apiUrl})\n3. Le serveur accepte les connexions CORS\n4. Aucun pare-feu ne bloque la connexion`);
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        throw new Error('Erreur lors de la connexion: ' + error.message);
      }
    }
  },

  register: async (user: Partial<User> & { motDePasseHash: string }): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', user);
    return response.data;
  },

  getCurrentUser: async (): Promise<{ email: string; authorities: any[] }> => {
    const response = await apiClient.get<{ email: string; authorities: any[] }>('/auth/me');
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  },
};

