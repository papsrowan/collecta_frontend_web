import apiClient from '../api';

export interface Collecte {
  idCollecte: number;
  compte: {
    numeroCompte: string;
    commerçant: {
      idCommercant: number;
      nomComplet: string;
    };
  };
  agent: {
    idAgent: number;
    codeAgent: string;
    nomAgent: string;
  };
  montant: number;
  dateCollecte: string;
  modePaiement: 'Espèces' | 'Mobile_Money' | 'Carte_Bancaire' | 'Virement';
  preuvePhoto?: string;
}

export interface CreateCollecteRequest {
  compte: {
    numeroCompte: string;
  };
  agent: {
    idAgent: number;
  };
  montant: number;
  dateCollecte: string;
  modePaiement: 'Espèces' | 'Mobile_Money' | 'Carte_Bancaire' | 'Virement';
  preuvePhoto?: string;
}

export interface CreateVersementRequest {
  numeroCompte: string;
  montant: number;
  modePaiement: 'Espèces' | 'Mobile_Money' | 'Carte_Bancaire' | 'Virement';
  preuvePhoto?: string;
}

export const collecteService = {
  getAll: async (): Promise<Collecte[]> => {
    const response = await apiClient.get<Collecte[]>('/collectes');
    return response.data;
  },

  getById: async (id: number): Promise<Collecte> => {
    const response = await apiClient.get<Collecte>(`/collectes/${id}`);
    return response.data;
  },

  getByCompte: async (numeroCompte: string): Promise<Collecte[]> => {
    const response = await apiClient.get<Collecte[]>(`/collectes/compte/${numeroCompte}`);
    return response.data;
  },

  getByAgent: async (agentId: number): Promise<Collecte[]> => {
    const response = await apiClient.get<Collecte[]>(`/collectes/agent/${agentId}`);
    return response.data;
  },

  create: async (data: CreateCollecteRequest): Promise<Collecte> => {
    const response = await apiClient.post<Collecte>('/collectes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateCollecteRequest>): Promise<Collecte> => {
    const response = await apiClient.put<Collecte>(`/collectes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/collectes/${id}`);
  },

  createVersement: async (data: CreateVersementRequest): Promise<Collecte> => {
    const response = await apiClient.post<Collecte>('/collectes/versement', data);
    return response.data;
  },
};
