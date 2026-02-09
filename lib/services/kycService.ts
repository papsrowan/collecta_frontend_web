import apiClient from '../api';

export type StatutValidation = 'EN_ATTENTE' | 'VALIDE' | 'REJETE';

export interface KYC {
  idKyc: number;
  commerçant: {
    idCommercant: number;
    nomComplet: string;
    nomBoutique?: string;
    telephone: string;
    zoneCollecte: string;
  };
  typeDocument: string;
  numeroPiece: string;
  photoRectoUrl: string;
  photoVersoUrl: string;
  statutValidation: StatutValidation;
  dateValidation?: string;
  commentaireValidation?: string;
}

export interface ValidationKYCRequest {
  statutValidation: 'VALIDE' | 'REJETE';
  commentaire?: string;
}

export const kycService = {
  getAll: async (): Promise<KYC[]> => {
    const response = await apiClient.get<KYC[]>('/kyc');
    return response.data;
  },

  getById: async (id: number): Promise<KYC> => {
    const response = await apiClient.get<KYC>(`/kyc/${id}`);
    return response.data;
  },

  getByCommercant: async (commercantId: number): Promise<KYC | null> => {
    try {
      const response = await apiClient.get<KYC>(`/kyc/commercant/${commercantId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getEnAttente: async (): Promise<KYC[]> => {
    const response = await apiClient.get<KYC[]>('/kyc/en-attente');
    return response.data;
  },

  create: async (data: Partial<KYC>): Promise<KYC> => {
    const response = await apiClient.post<KYC>('/kyc', data);
    return response.data;
  },

  update: async (id: number, data: Partial<KYC>): Promise<KYC> => {
    const response = await apiClient.put<KYC>(`/kyc/${id}`, data);
    return response.data;
  },

  valider: async (id: number, data: ValidationKYCRequest): Promise<KYC> => {
    const response = await apiClient.post<KYC>(`/kyc/${id}/valider`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/kyc/${id}`);
  },
};

