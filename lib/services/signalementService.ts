import apiClient from '../api';

export interface SignalementCollecte {
  idSignalement?: number;
  commerçant: {
    idCommercant: number;
    nomComplet: string;
    telephone?: string;
  };
  numeroCompte: string;
  montant: number;
  dateVersement: string;
  description: string;
  statut: 'En_attente' | 'Traité' | 'Rejeté';
  dateSignalement?: string;
}

export interface SignalementCollecteRequest {
  numeroCompte: string;
  montant: number;
  dateVersement: string;
  description: string;
}

export interface StatutUpdateRequest {
  statut: 'En_attente' | 'Traité' | 'Rejeté';
}

export const signalementService = {
  // Créer un signalement (pour les commerçants)
  create: async (data: SignalementCollecteRequest): Promise<{ message: string; id: number }> => {
    const response = await apiClient.post('/collectes/signaler', data);
    return response.data;
  },

  // Récupérer tous les signalements (admin uniquement)
  getAll: async (): Promise<SignalementCollecte[]> => {
    const response = await apiClient.get('/signalements');
    return response.data;
  },

  // Récupérer un signalement par ID (admin uniquement)
  getById: async (id: number): Promise<SignalementCollecte> => {
    const response = await apiClient.get(`/signalements/${id}`);
    return response.data;
  },

  // Récupérer les signalements d'un commerçant
  getByCommercant: async (commercantId: number): Promise<SignalementCollecte[]> => {
    const response = await apiClient.get(`/signalements/commercant/${commercantId}`);
    return response.data;
  },

  // Récupérer les signalements par statut (admin uniquement)
  getByStatut: async (statut: 'En_attente' | 'Traité' | 'Rejeté'): Promise<SignalementCollecte[]> => {
    const response = await apiClient.get(`/signalements/statut/${statut}`);
    return response.data;
  },

  // Mettre à jour le statut d'un signalement (admin uniquement)
  updateStatut: async (id: number, statut: 'En_attente' | 'Traité' | 'Rejeté'): Promise<SignalementCollecte> => {
    const response = await apiClient.put(`/signalements/${id}/statut`, { statut });
    return response.data.signalement;
  },

  // Supprimer un signalement (admin uniquement)
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/signalements/${id}`);
  },
};
