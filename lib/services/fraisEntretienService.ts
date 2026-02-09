import apiClient from '../api';

export interface FraisEntretienConfig {
  id?: number;
  taux?: number;
  commerçant?: {
    idCommercant: number;
    nomComplet: string;
  };
  tauxSpecifique?: number;
  dateCreation?: string;
  derniereModification?: string;
}

export interface PrelevementFrais {
  id: number;
  compte: {
    numeroCompte: string;
    commerçant: {
      nomComplet: string;
    };
  };
  montantPreleve: number;
  tauxApplique: number;
  soldeAvantPrelevement: number;
  soldeApresPrelevement: number;
  datePrelevement: string;
}

export const fraisEntretienService = {
  getMonTaux: async (): Promise<{ taux: number; soldeTotal: number; nombreComptes: number; commercant: string }> => {
    const response = await apiClient.get('/frais-entretien/mon-taux');
    return response.data;
  },

  getGlobalConfig: async (): Promise<FraisEntretienConfig> => {
    const response = await apiClient.get<FraisEntretienConfig>('/frais-entretien/taux-global');
    return response.data;
  },

  updateGlobalTaux: async (taux: number): Promise<FraisEntretienConfig> => {
    const response = await apiClient.post<FraisEntretienConfig>(`/frais-entretien/taux-global?taux=${taux}`);
    return response.data;
  },

  getClientConfig: async (commercantId: number): Promise<FraisEntretienConfig | null> => {
    try {
      const response = await apiClient.get<FraisEntretienConfig>(`/frais-entretien/taux-commercant/${commercantId}`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw error;
    }
  },

  setClientTaux: async (commercantId: number, taux: number): Promise<FraisEntretienConfig> => {
    const response = await apiClient.post<FraisEntretienConfig>(`/frais-entretien/taux-commercant/${commercantId}?taux=${taux}`);
    return response.data;
  },

  deleteClientTaux: async (commercantId: number): Promise<void> => {
    await apiClient.delete(`/frais-entretien/taux-commercant/${commercantId}`);
  },

  preleverManuellement: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/frais-entretien/prelever-manuellement');
    return response.data;
  },

  getHistoriquePrelevements: async (): Promise<PrelevementFrais[]> => {
    const response = await apiClient.get<PrelevementFrais[]>('/frais-entretien/prelevements/historique');
    return response.data;
  },
};
