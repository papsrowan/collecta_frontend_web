import apiClient from '../api';

export interface StatistiquesAgent {
  agentId: number;
  nomAgent: string;
  codeAgent: string;
  montantTotalCollecte: number;
  montantCollecteAujourdhui: number;
  nombreCommercantsTotal: number;
  nombreCommercantsAujourdhui: number;
  nombreCollectesTotal: number;
  nombreCollectesAujourdhui: number;
  objectMensuel: number;
  tauxRealisationObjectif: string;
  date: string;
}

export interface StatistiquesGlobales {
  nombreCommercantsTotal: number;
  nombreCommercantsAujourdhui: number;
  nombreAgentsActifs: number;
  nombreAgentsTotal: number;
  montantTotalCollecte: number;
  montantCollecteAujourdhui: number;
  nombreCollectesTotal: number;
  nombreCollectesAujourdhui: number;
  nombreCollectesValideesAujourdhui: number;
  montantTotalRetrait: number;
  montantRetraitAujourdhui: number;
  nombreRetraitsTotal: number;
  nombreComptesActifs: number;
  nombreComptesTotal: number;
  montantTotalFraisEntretien: number;
  montantFraisEntretienCeMois: number;
  soldeTotalComptes: number;
  date: string;
}

export const statistiqueService = {
  getStatistiquesAgent: async (agentId: number): Promise<StatistiquesAgent> => {
    const response = await apiClient.get<StatistiquesAgent>(`/statistiques/agent/${agentId}`);
    return response.data;
  },

  getMesStatistiques: async (): Promise<StatistiquesAgent> => {
    const response = await apiClient.get<StatistiquesAgent>('/statistiques/mes-statistiques');
    return response.data;
  },

  getStatistiquesGlobales: async (): Promise<StatistiquesGlobales> => {
    const response = await apiClient.get<StatistiquesGlobales>('/statistiques/globales');
    return response.data;
  },
};

