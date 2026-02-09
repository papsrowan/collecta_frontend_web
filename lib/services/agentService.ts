import apiClient from '../api';

export interface Agent {
  idAgent: number;
  idUtilisateur: number;
  codeAgent: string;
  nomAgent: string;
  telephone: string;
  zoneAffectation: string;
  objectMensuelFcfa: number;
}

export interface CreateAgentRequest {
  idUtilisateur: number;
  nomAgent: string;
  telephone: string;
  zoneAffectation: string;
  objectMensuelFcfa: number;
}

export interface AgentActivity {
  type: 'COLLECTE' | 'COMMERCANT' | 'KYC';
  description: string;
  montant: number | null;
  dateHeure: string;
  statut: string;
  details: string;
}

export const agentService = {
  getAll: async (): Promise<Agent[]> => {
    const response = await apiClient.get<Agent[]>('/agents');
    return response.data;
  },

  getById: async (id: number): Promise<Agent> => {
    const response = await apiClient.get<Agent>(`/agents/${id}`);
    return response.data;
  },

  getActivity: async (id: number): Promise<AgentActivity[]> => {
    const response = await apiClient.get<AgentActivity[]>(`/agents/${id}/activite`);
    return response.data;
  },

  create: async (data: CreateAgentRequest): Promise<Agent> => {
    const response = await apiClient.post<Agent>('/agents', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateAgentRequest>): Promise<Agent> => {
    const response = await apiClient.put<Agent>(`/agents/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/agents/${id}`);
  },
};

