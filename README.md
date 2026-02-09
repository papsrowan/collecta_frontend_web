# Collecte Journalière - Frontend Admin

Application Next.js pour l'administration du système de collecte journalière.

## Fonctionnalités

- 🔐 **Authentification** : Connexion sécurisée avec JWT
- 👥 **Gestion des utilisateurs** : Création, modification et suppression d'utilisateurs
- 🏢 **Gestion des agents** : Création et gestion des agents de terrain
- 📊 **Tableau de bord** : Suivi des performances et statistiques des agents

## Prérequis

- Node.js 18+ et npm
- Backend Spring Boot en cours d'exécution sur `http://localhost:8080`

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer l'URL de l'API :
```bash
cp .env.local.example .env.local
```

Puis éditez `.env.local` et ajustez `NEXT_PUBLIC_API_URL` si nécessaire.

## Démarrage

Lancer le serveur de développement :
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
collecte-journaliere-frontend/
├── app/                    # Pages Next.js (App Router)
│   ├── dashboard/         # Tableau de bord
│   ├── login/             # Page de connexion
│   ├── utilisateurs/     # Gestion des utilisateurs
│   └── agents/            # Gestion des agents
├── components/            # Composants React réutilisables
│   └── Navbar.tsx         # Barre de navigation
├── lib/                    # Services et utilitaires
│   ├── api.ts             # Configuration axios
│   ├── auth.ts            # Service d'authentification
│   └── services/          # Services API
│       ├── agentService.ts
│       ├── statistiqueService.ts
│       └── utilisateurService.ts
└── public/                # Fichiers statiques
```

## Utilisation

### Connexion

1. Accédez à `/login`
2. Connectez-vous avec un compte Admin

### Gestion des utilisateurs

- Accédez à `/utilisateurs`
- Cliquez sur "+ Nouvel utilisateur" pour créer un utilisateur
- Les utilisateurs peuvent être des Admins ou des Agents

### Gestion des agents

- Accédez à `/agents`
- Cliquez sur "+ Nouvel agent" pour créer un agent
- Un agent doit être lié à un utilisateur de type "Agent"

### Tableau de bord

- Accédez à `/dashboard`
- Visualisez les statistiques de tous les agents :
  - Montant total collecté
  - Montant collecté aujourd'hui
  - Nombre de commerçants enregistrés
  - Nombre de collectes
  - Taux de réalisation de l'objectif mensuel

## Technologies utilisées

- **Next.js 16** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS utilitaire
- **Axios** : Client HTTP pour les appels API

## Notes

- Le token JWT est stocké dans `localStorage`
- Les requêtes API incluent automatiquement le token JWT dans les headers
- En cas d'erreur 401 (non autorisé), l'utilisateur est redirigé vers la page de connexion
