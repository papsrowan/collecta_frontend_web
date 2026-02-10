import apiClient from '@/lib/api';

export interface Microfinance {
  id: number;
  nom: string;
  code: string;
  contact: string;
  actif: boolean;
  dateFinValidite: string | null;
  dateCreation: string;
  adminEmail?: string;
  adminNom?: string;
}

export interface CreateMicrofinanceRequest {
  nom: string;
  code: string;
  contact: string;
  actif?: boolean;
  dateFinValidite?: string | null;
  adminEmail: string;
  adminPassword: string;
  adminNom: string;
}

export interface UpdateMicrofinanceRequest {
  nom?: string;
  code?: string;
  contact?: string;
  actif?: boolean;
  dateFinValidite?: string | null;
}

export const microfinanceService = {
  getAll: async (): Promise<Microfinance[]> => {
    const response = await apiClient.get<Microfinance[]>('/super-admin/microfinances');
    return response.data ?? [];
  },

  getById: async (id: number): Promise<Microfinance> => {
    const response = await apiClient.get<Microfinance>(`/super-admin/microfinances/${id}`);
    return response.data;
  },

  create: async (data: CreateMicrofinanceRequest): Promise<Microfinance> => {
    const response = await apiClient.post<Microfinance>('/super-admin/microfinances', data);
    return response.data;
  },

  update: async (id: number, data: UpdateMicrofinanceRequest): Promise<Microfinance> => {
    const response = await apiClient.put<Microfinance>(`/super-admin/microfinances/${id}`, data);
    return response.data;
  },

  activer: async (id: number): Promise<void> => {
    await apiClient.patch(`/super-admin/microfinances/${id}/activer`);
  },

  desactiver: async (id: number): Promise<void> => {
    await apiClient.patch(`/super-admin/microfinances/${id}/desactiver`);
  },
};
