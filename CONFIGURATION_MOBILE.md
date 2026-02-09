# Configuration pour accès depuis téléphone mobile

## Problème
Par défaut, l'application utilise `localhost:8080` comme URL de l'API, ce qui ne fonctionne pas depuis un téléphone car `localhost` fait référence à l'appareil lui-même.

## Solution
Vous devez configurer l'URL de l'API avec l'adresse IP locale de votre ordinateur.

## Étapes

### 1. Trouver votre adresse IP locale

#### Sur Windows :
Ouvrez l'invite de commande (CMD) et tapez :
```cmd
ipconfig
```
Cherchez "Adresse IPv4" sous votre connexion réseau active (généralement "Carte réseau Ethernet" ou "Carte réseau sans fil Wi-Fi").

#### Exemples d'IP possibles :
- `172.20.10.4` (réseau Wi-Fi)
- `192.168.1.100` (réseau local)
- `192.168.56.1` (réseau virtuel)
- `172.28.176.1` (autre réseau)

### 2. Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet `collecte-journaliere-frontend` avec le contenu suivant :

```env
NEXT_PUBLIC_API_URL=http://VOTRE_IP_LOCALE:8080/api
```

**Exemple** (remplacez par votre IP) :
```env
NEXT_PUBLIC_API_URL=http://172.20.10.4:8080/api
```

### 3. Vérifier que le serveur Spring Boot accepte les connexions

Le fichier `SecurityConfig.java` a été configuré pour accepter toutes les origines avec `setAllowedOriginPatterns(Arrays.asList("*"))`, ce qui devrait permettre les connexions depuis n'importe quel appareil sur le réseau local.

### 4. Démarrer le serveur Spring Boot

Assurez-vous que le serveur Spring Boot est démarré et écoute sur le port 8080.

### 5. Démarrer l'application Next.js

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000` sur votre ordinateur.

### 6. Accéder depuis votre téléphone

1. Assurez-vous que votre téléphone est sur le même réseau Wi-Fi que votre ordinateur
2. Ouvrez le navigateur sur votre téléphone
3. Accédez à : `http://VOTRE_IP_LOCALE:3000`
   - Exemple : `http://172.20.10.4:3000`

### 7. Résolution de problèmes

#### Le téléphone ne peut pas se connecter :
- Vérifiez que le téléphone et l'ordinateur sont sur le même réseau Wi-Fi
- Vérifiez que le pare-feu Windows n'bloque pas le port 3000 (Next.js) et 8080 (Spring Boot)
- Vérifiez que l'IP est correcte (essayez de ping l'IP depuis le téléphone si possible)

#### Erreur de connexion à l'API :
- Vérifiez que le serveur Spring Boot est démarré
- Vérifiez que l'URL dans `.env.local` est correcte
- Redémarrez le serveur Next.js après avoir modifié `.env.local`

#### Erreur CORS :
- Le fichier `SecurityConfig.java` devrait déjà accepter toutes les origines
- Si le problème persiste, vérifiez la configuration CORS dans le backend
