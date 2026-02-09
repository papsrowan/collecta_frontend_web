import apiClient from '../api';

export interface Commercant {
  idCommercant: number;
  agentAttitre: {
    idAgent: number;
    codeAgent: string;
    nomAgent: string;
  };
  nomComplet: string;
  nomBoutique?: string;
  telephone: string;
  zoneCollecte: string;
  adresseRepere: string;
  photoProfilUrl?: string;
  dateCreation: string;
}

export interface CreateCommercantRequest {
  agentAttitre: {
    idAgent: number;
  };
  nomComplet: string;
  nomBoutique?: string;
  telephone: string;
  zoneCollecte: string;
  adresseRepere: string;
  photoProfilUrl?: string;
  email: string; // Email pour la création du compte utilisateur
}

export const commerçantService = {
  getAll: async (): Promise<Commercant[]> => {
    try {
      console.log('Appel API: GET /commercants');
      const response = await apiClient.get<Commercant[]>('/commercants');
      console.log('Réponse API getAll commercants:', response);
      console.log('Response.data:', response.data);
      console.log('Type de response.data:', typeof response.data, Array.isArray(response.data));
      
      let data = response.data;
      
      // Si response.data est une chaîne, la parser
      if (typeof data === 'string') {
        console.log('Response.data est une chaîne, parsing JSON...');
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
        console.log(`Nombre de commercants trouvés: ${data.length}`);
        return data;
      }
      
      console.warn('La réponse de getAll n\'est pas un tableau après parsing:', data);
      return [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération de tous les commercants:', error);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      throw error;
    }
  },

  getById: async (id: number): Promise<Commercant> => {
    const response = await apiClient.get<Commercant>(`/commercants/${id}`);
    return response.data;
  },

  search: async (nom?: string, sortBy: string = 'nom'): Promise<Commercant[]> => {
    try {
      const params = new URLSearchParams();
      if (nom) params.append('nom', nom);
      params.append('sortBy', sortBy);
      const response = await apiClient.get<Commercant[]>(`/commercants/search?${params.toString()}`);
      // S'assurer que la réponse est un tableau
      if (Array.isArray(response.data)) {
        return response.data;
      }
      console.warn('La réponse de search n\'est pas un tableau:', response.data);
      return [];
    } catch (error: any) {
      console.error('Erreur lors de la recherche de commerçants:', error);
      throw error;
    }
  },

  create: async (data: CreateCommercantRequest & { email: string }): Promise<Commercant> => {
    // Envoyer l'email avec les autres données
    const response = await apiClient.post<Commercant>('/commercants', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateCommercantRequest>): Promise<Commercant> => {
    const response = await apiClient.put<Commercant>(`/commercants/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/commercants/${id}`);
  },

  getCollectes: async (id: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/commercants/${id}/collectes`);
    return response.data;
  },

  getRetraits: async (id: number): Promise<any[]> => {
    const response = await apiClient.get<any[]>(`/commercants/${id}/retraits`);
    return response.data;
  },

  getIdentifiants: async (id: number): Promise<{ email: string; initialPassword: string }> => {
    const response = await apiClient.get<{ email: string; motDePasse: string }>(`/commercants/${id}/identifiants`);
    return {
      email: response.data.email,
      initialPassword: response.data.motDePasse,
    };
  },

  getByAgent: async (agentId: number): Promise<Commercant[]> => {
    try {
      console.log(`Appel API: GET /commercants/agent/${agentId}`);
      const response = await apiClient.get<Commercant[]>(`/commercants/agent/${agentId}`);
      console.log('Réponse API getByAgent:', response);
      console.log('Response.data:', response.data);
      console.log('Type de response.data:', typeof response.data, Array.isArray(response.data));
      
      // S'assurer que la réponse est un tableau
      if (Array.isArray(response.data)) {
        console.log(`Nombre de clients trouvés: ${response.data.length}`);
        return response.data;
      }
      
      // Si la réponse n'est pas un tableau, retourner un tableau vide
      console.warn('La réponse de l\'API n\'est pas un tableau:', response.data);
      return [];
    } catch (error: any) {
      console.error('Erreur lors de la récupération des commerçants par agent:', error);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      
      // Si l'endpoint n'existe pas ou retourne 404, retourner un tableau vide
      if (error.response?.status === 404) {
        console.warn(`Aucun client trouvé pour l'agent ${agentId} (404)`);
        return [];
      }
      
      // Pour les autres erreurs, propager l'erreur
      throw error;
    }
  },

  getMonProfil: async (): Promise<Commercant> => {
    const response = await apiClient.get<Commercant>('/commercants/mon-profil');
    return response.data;
  },
};

