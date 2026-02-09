import apiClient from '../api';

export interface Compte {
  numeroCompte: string;
  commerçant: {
    idCommercant: number;
    nomComplet: string;
    nomBoutique?: string;
    telephone: string;
  };
  soldeActuel: number;
  dateOuverture: string;
  statutCompte: string;
}

export const compteService = {
  getAll: async (): Promise<Compte[]> => {
    const response = await apiClient.get('/comptes');
    return response.data;
  },

  getByNumero: async (numeroCompte: string): Promise<Compte> => {
    const response = await apiClient.get(`/comptes/${numeroCompte}`);
    return response.data;
  },

  getByCommercant: async (commercantId: number): Promise<Compte[]> => {
    const response = await apiClient.get(`/comptes/commercant/${commercantId}`);
    return response.data;
  },

  getMesComptes: async (): Promise<Compte[]> => {
    const response = await apiClient.get('/comptes/mes-comptes');
    return response.data;
  },
};
