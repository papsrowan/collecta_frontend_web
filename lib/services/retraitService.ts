import apiClient from '../api';

export interface Retrait {
  idRetrait: number;
  compte: {
    numeroCompte: string;
    commerçant: {
      idCommercant: number;
      nomComplet: string;
      nomBoutique?: string;
      telephone: string;
    };
    soldeActuel: number;
  };
  montant: number;
  motif?: string;
  dateRetrait: string;
  utilisateurCaisse: {
    idUtilisateur: number;
    email: string;
  };
}

export interface CreateRetraitRequest {
  numeroCompte: string;
  montant: number;
  motif?: string;
}

export const retraitService = {
  getAll: async (): Promise<Retrait[]> => {
    const response = await apiClient.get('/retraits');
    return response.data;
  },

  getById: async (id: number): Promise<Retrait> => {
    const response = await apiClient.get(`/retraits/${id}`);
    return response.data;
  },

  getByCompte: async (numeroCompte: string): Promise<Retrait[]> => {
    const response = await apiClient.get(`/retraits/compte/${numeroCompte}`);
    return response.data;
  },

  getByUtilisateur: async (utilisateurId: number): Promise<Retrait[]> => {
    const response = await apiClient.get(`/retraits/utilisateur/${utilisateurId}`);
    return response.data;
  },

  create: async (data: CreateRetraitRequest): Promise<Retrait> => {
    const response = await apiClient.post('/retraits', data);
    return response.data;
  },

  downloadReceipt: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/retraits/${id}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

