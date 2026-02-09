import { agentService, Agent } from '@/lib/services/agentService';
import { authService } from '@/lib/auth';

/**
 * Récupère l'agent connecté depuis localStorage ou l'API
 */
export async function getCurrentAgent(): Promise<Agent | null> {
  try {
    // Essayer d'abord depuis localStorage
    if (typeof window !== 'undefined') {
      const userInfoStr = localStorage.getItem('userInfo');
      console.log('userInfo depuis localStorage:', userInfoStr);
      
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          console.log('userInfo parsé:', userInfo);
          
          if (userInfo.idAgent) {
            console.log('ID Agent trouvé dans userInfo:', userInfo.idAgent);
            const agent = await agentService.getById(userInfo.idAgent);
            console.log('Agent récupéré depuis API:', agent);
            return agent;
          } else {
            console.warn('userInfo existe mais idAgent manquant:', userInfo);
          }
        } catch (parseError) {
          console.error('Erreur lors du parsing de userInfo:', parseError);
        }
      } else {
        console.warn('userInfo non trouvé dans localStorage');
      }
    }

    // Si on arrive ici, userInfo n'existe pas ou n'a pas d'idAgent
    console.warn('Impossible de récupérer l\'agent depuis localStorage. Vérifiez que vous êtes connecté en tant qu\'agent.');
    return null;
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'agent:', err);
    return null;
  }
}
