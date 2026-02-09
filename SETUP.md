# Guide de Configuration

## Configuration de l'environnement

1. **Créer le fichier `.env.local`** :
   ```bash
   cp .env.local.example .env.local
   ```

2. **Éditer `.env.local`** et configurer l'URL de l'API :
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```
   
   Si votre backend Spring Boot tourne sur un autre port ou une autre adresse, modifiez cette valeur.

## Démarrage

1. **Installer les dépendances** (si ce n'est pas déjà fait) :
   ```bash
   npm install
   ```

2. **Démarrer le serveur de développement** :
   ```bash
   npm run dev
   ```

3. **Accéder à l'application** :
   Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Première connexion

1. Assurez-vous que le backend Spring Boot est en cours d'exécution.
2. Accédez à `/login`.
3. Connectez-vous avec un compte Admin existant dans la base de données.

> **Note** : Si vous n'avez pas encore d'utilisateur Admin, vous devrez en créer un directement dans la base de données ou via une autre méthode (API directe, script SQL, etc.).

## Structure des pages

- **`/login`** : Page de connexion
- **`/dashboard`** : Tableau de bord avec les statistiques des agents
- **`/utilisateurs`** : Gestion des utilisateurs (création, liste, suppression)
- **`/agents`** : Gestion des agents (création, liste, suppression)

## Dépannage

### Erreur de connexion à l'API

- Vérifiez que le backend Spring Boot est en cours d'exécution.
- Vérifiez l'URL dans `.env.local`.
- Vérifiez les logs du backend pour les erreurs CORS (si nécessaire, configurez CORS dans le backend).

### Token expiré

- Le token JWT expire après 24 heures par défaut.
- Si vous êtes déconnecté automatiquement, reconnectez-vous.

### Erreur 401 (Non autorisé)

- Vérifiez que vous êtes connecté avec un compte Admin.
- Vérifiez que le token est bien stocké dans `localStorage` (Onglet Application > Local Storage dans les DevTools du navigateur).

