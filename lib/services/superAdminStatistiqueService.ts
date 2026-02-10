import apiClient from '../api';

export interface VueEnsembleDTO {
  nombreMicrofinancesTotal: number;
  nombreMicrofinancesActives: number;
  nombreAgentsTotal: number;
  nombreCommercantsTotal: number;
  nombreComptesTotal: number;
  nombreComptesActifs: number;
  montantTotalCollectes: number;
  nombreTotalCollectes: number;
  montantTotalRetraits: number;
  nombreTotalRetraits: number;
  soldeTotalComptes: number;
  montantTotalFraisEntretien: number;
}

export interface TopAgentCollecteDTO {
  agentId: number;
  nomAgent: string;
  codeAgent: string;
  microfinanceNom: string;
  microfinanceId: number;
  montantTotalCollectes: number;
  nombreCollectes: number;
}

export interface TopMicrofinanceCollecteDTO {
  microfinanceId: number;
  nom: string;
  code: string;
  actif: boolean;
  montantTotalCollectes: number;
  nombreCollectes: number;
  nombreAgents: number;
  nombreCommercants: number;
  nombreRetraits: number;
  montantTotalRetraits: number;
}

export interface ClientStatDTO {
  commercantId: number;
  nomComplet: string;
  nomBoutique?: string;
  microfinanceNom: string;
  microfinanceId: number;
  montant: number;
  nombreOperations: number;
}

export interface ModePaiementStatDTO {
  modePaiement: string;
  nombre: number;
  montant: number;
}

export interface MicrofinanceEcheanceDTO {
  microfinanceId: number;
  nom: string;
  code: string;
  dateFinValidite: string;
  expiree: boolean;
  bientotExpiree: boolean;
}

export interface MicrofinanceAgentsDTO {
  microfinanceId: number;
  nom: string;
  nombreAgentsTotal: number;
  nombreAgentsActifs: number;
}

export interface SuperAdminStatistiquesDTO {
  vueEnsemble: VueEnsembleDTO;
  topAgentsParCollectes: TopAgentCollecteDTO[];
  topMicrofinancesParCollectes: TopMicrofinanceCollecteDTO[];
  clientsAvecMoinsRetraits: ClientStatDTO[];
  clientsAvecPlusRetraits: ClientStatDTO[];
  topClientsParCollectes: ClientStatDTO[];
  topClientsParNombreCollectes: ClientStatDTO[];
  collectesParModePaiement: ModePaiementStatDTO[];
  microfinancesEcheance: MicrofinanceEcheanceDTO[];
  agentsParMicrofinance: MicrofinanceAgentsDTO[];
}

export const superAdminStatistiqueService = {
  getStatistiques: async (): Promise<SuperAdminStatistiquesDTO> => {
    const response = await apiClient.get<SuperAdminStatistiquesDTO>('/super-admin/statistiques');
    return response.data;
  },
};
