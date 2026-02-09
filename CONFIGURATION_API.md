# Configuration de l'URL de l'API

## Problème : Erreur "Impossible de contacter le serveur"

Si vous voyez cette erreur dans l'application web Next.js, cela signifie que l'application ne peut pas se connecter au serveur Spring Boot.

## Solution

### 1. Vérifier que le serveur Spring Boot est démarré

Assurez-vous que le serveur Spring Boot est en cours d'exécution. Vous devriez voir des messages de démarrage dans la console.

### 2. Créer le fichier `.env.local`

À la racine du projet `collecte-journaliere-frontend`, créez un fichier nommé `.env.local` avec le contenu suivant :

```env
NEXT_PUBLIC_API_URL=http://172.20.10.4:8080/api
```

**Important :** Remplacez `172.20.10.4` par l'adresse IP de votre machine si elle est différente.

### 3. Trouver votre adresse IP

Pour trouver votre adresse IP locale :

**Windows :**
```powershell
ipconfig
```
Cherchez la ligne "Adresse IPv4" pour votre interface réseau active.

**Linux/Mac :**
```bash
ifconfig
# ou
ip addr
```

### 4. Utiliser localhost (alternative)

Si le serveur Spring Boot et Next.js sont sur la même machine, vous pouvez utiliser localhost :

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 5. Redémarrer le serveur Next.js

Après avoir créé ou modifié le fichier `.env.local`, vous devez redémarrer le serveur Next.js :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez-le
npm run dev
```

### 6. Vérifier la configuration CORS

Si vous obtenez toujours des erreurs, vérifiez que votre adresse IP est autorisée dans la configuration CORS de Spring Boot.

Le fichier `SecurityConfig.java` doit contenir votre adresse IP dans la liste `setAllowedOrigins()`.

### 7. Vérifier le port du serveur Spring Boot

Par défaut, Spring Boot écoute sur le port `8080`. Vérifiez dans votre fichier `application.properties` ou `application.yml` :

```properties
server.port=8080
```

## Exemple de fichier `.env.local`

```env
# Utiliser l'adresse IP locale de votre machine
NEXT_PUBLIC_API_URL=http://172.20.10.4:8080/api

# OU utiliser localhost si sur la même machine
# NEXT_PUBLIC_API_URL=http://localhost:8080/api

# OU utiliser une autre adresse IP si nécessaire
# NEXT_PUBLIC_API_URL=http://192.168.1.100:8080/api
```

## Vérification

Pour vérifier que la configuration fonctionne :

1. Vérifiez que le serveur Spring Boot répond : `http://172.20.10.4:8080/api/auth/login` (ou votre URL)
2. Ouvrez la console du navigateur (F12) et vérifiez qu'il n'y a pas d'erreurs CORS
3. Vérifiez que les requêtes sont envoyées à la bonne URL dans l'onglet "Network"

## Dépannage

### Erreur CORS

Si vous voyez une erreur CORS dans la console du navigateur, ajoutez votre URL dans `SecurityConfig.java` du projet Spring Boot.

### Erreur de connexion réseau

- Vérifiez que le serveur Spring Boot est bien démarré
- Vérifiez que le port 8080 n'est pas utilisé par un autre programme
- Vérifiez les paramètres du pare-feu Windows

### L'URL ne change pas après modification

- Assurez-vous que le fichier s'appelle bien `.env.local` (avec le point au début)
- Redémarrez complètement le serveur Next.js (arrêtez et relancez)
- Videz le cache du navigateur si nécessaire
