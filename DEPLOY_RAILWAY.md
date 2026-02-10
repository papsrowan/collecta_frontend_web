# Déployer le frontend Collecta sur Railway

Ce dossier est le **frontend Next.js** de Collecta. Pour déployer **tout le projet** (backend + frontend + MySQL), suivez le guide complet dans le backend :

- **Chemin** : `collecte-journaliere/DEPLOY_RAILWAY.md` (à la racine du dépôt ou dans le dossier backend).

## Résumé rapide (service Frontend uniquement)

1. **Créer un service** Railway avec **Root Directory** = `collecte-journaliere-frontend` (si monorepo).
2. **Variable obligatoire** :
   - `NEXT_PUBLIC_API_URL` = `https://<url-du-backend>/api`  
     Exemple : `https://collecte-journaliere-backend-production-xxxx.up.railway.app/api`
3. **Build / Start** : pris en charge par `railway.toml` (`npm run build` puis `npm start`).
4. **Networking** : générer un domaine public pour le frontend.

Le backend doit déjà être déployé et accessible pour que le frontend puisse appeler l’API.
