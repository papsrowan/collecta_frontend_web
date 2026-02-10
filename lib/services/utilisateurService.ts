import apiClient from '../api';
import { User } from '../auth';

export interface CreateUtilisateurRequest {
  email: string;
  motDePasseHash: string;
  role: 'Admin' | 'Adjoint' | 'Agent' | 'Caisse';
  statutUtilisateur?: 'Actif' | 'Bloqué';
}

export interface UserCredentials {
  email: string;
  motDePasseInitial: string;
}

export interface UpdateStatutRequest {
  statutUtilisateur: 'Actif' | 'Bloqué';
}

export interface ResetPasswordRequest {
  nouveauMotDePasse: string;
}

export const utilisateurService = {
  getAll: async (): Promise<User[]> => {
    try {
      console.log('Appel API: GET /utilisateurs');
      const response = await apiClient.get<User[]>('/utilisateurs');
      console.log('Réponse API getAll utilisateurs:', response);
      console.log('Response.data:', response.data);
      console.log('Type de response.data:', typeof response.data, Array.isArray(response.data));
      
      let data = response.data;
      
      // Si response.data est une chaîne JSON, la parser
      if (typeof data === 'string') {
        console.log('Parsing JSON string...');
        try {
          data = JSON.parse(data);
          console.log('Données parsées:', data);
        } catch (parseError) {
          console.error('Erreur lors du parsing JSON:', parseError);
          return [];
        }
      }
      
      // S'assurer que la réponse est un tableau
      if (Array.isArray(data)) {
        console.log(`Nombre d'utilisateurs trouvés: ${data.length}`);
        return data;
      }
      console.warn('La réponse de getAll n\'est pas un tableau:', data);
      return [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération de tous les utilisateurs:', error);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      throw error;
    }
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/utilisateurs/${id}`);
    return response.data;
  },

  create: async (data: CreateUtilisateurRequest): Promise<User> => {
    const response = await apiClient.post<User>('/utilisateurs', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateUtilisateurRequest>): Promise<User> => {
    const response = await apiClient.put<User>(`/utilisateurs/${id}`, data);
    return response.data;
  },

  updateStatut: async (id: number, statut: 'Actif' | 'Bloqué'): Promise<User> => {
    const response = await apiClient.patch<User>(`/utilisateurs/${id}/statut`, {
      statutUtilisateur: statut,
    });
    return response.data;
  },

  resetPassword: async (id: number, nouveauMotDePasse: string): Promise<User> => {
    const response = await apiClient.patch<User>(`/utilisateurs/${id}/reset-password`, {
      nouveauMotDePasse,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/utilisateurs/${id}`);
  },

  getCredentials: async (id: number): Promise<UserCredentials> => {
    const response = await apiClient.get<UserCredentials>(`/utilisateurs/${id}/credentials`);
    return response.data;
  },
};

