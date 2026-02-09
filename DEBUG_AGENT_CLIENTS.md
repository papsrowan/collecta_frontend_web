# Guide de débogage - Liste des clients de l'agent

## Problème
Impossible d'afficher la liste des clients de l'agent.

## Étapes de débogage

### 1. Vérifier que vous êtes connecté en tant qu'agent

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Console"
3. Tapez dans la console :
```javascript
localStorage.getItem('userInfo')
```

Vous devriez voir quelque chose comme :
```json
{"idAgent": 1, "nomAgent": "Nom Agent", "codeAgent": "AG001", "email": "agent@example.com"}
```

**Si `idAgent` est manquant** : Le problème vient du login. Vérifiez que vous vous connectez avec un compte Agent.

### 2. Vérifier que l'agent est récupéré

Dans la console du navigateur, vous devriez voir des logs comme :
- `userInfo depuis localStorage: ...`
- `userInfo parsé: ...`
- `ID Agent trouvé dans userInfo: ...`
- `Agent récupéré depuis API: ...`

**Si vous voyez "Agent non trouvé"** : Vérifiez que l'API `/api/agents/{id}` fonctionne.

### 3. Vérifier l'appel API pour les clients

Dans la console, vous devriez voir :
- `Appel API: GET /commercants/agent/{id}`
- `Réponse API getByAgent: ...`

**Si vous voyez une erreur 404** : L'endpoint n'existe pas ou l'agent n'a pas d'ID.
**Si vous voyez une erreur 403** : Problème d'autorisation.
**Si vous voyez une erreur 500** : Erreur côté serveur.

### 4. Tester l'endpoint directement

Ouvrez une nouvelle fenêtre et testez l'endpoint directement :
```
http://172.20.10.4:8080/api/commercants/agent/1
```
(Remplacez `1` par l'ID de votre agent)

Vous devriez voir une réponse JSON avec un tableau de commerçants.

### 5. Vérifier que l'agent a des clients assignés

Si l'API retourne un tableau vide `[]`, cela signifie que l'agent n'a pas encore de clients assignés. C'est normal si c'est un nouvel agent.

### 6. Vérifier les permissions

Assurez-vous que :
- Vous êtes connecté avec un token valide
- Votre compte a le rôle "Agent"
- L'API accepte les requêtes depuis votre origine (CORS)

## Solutions possibles

### Solution 1 : Vérifier le login

Si `userInfo` n'a pas d'`idAgent`, vérifiez que :
1. Vous vous connectez avec un compte Agent (pas Admin ou Caisse)
2. Le backend retourne bien `userInfo` avec `idAgent` dans la réponse de login
3. Le token JWT contient bien les informations de l'agent

### Solution 2 : Vérifier l'endpoint backend

Assurez-vous que l'endpoint `/api/commercants/agent/{agentId}` existe dans le backend Spring Boot.

Dans le fichier `CommercantController.java`, vous devriez avoir :
```java
@GetMapping("/agent/{agentId}")
public ResponseEntity<List<Commercant>> getCommercantsByAgent(@PathVariable Integer agentId)
```

### Solution 3 : Vérifier les données

Si l'endpoint retourne un tableau vide, c'est normal. L'agent n'a simplement pas encore de clients assignés.

Pour créer des clients :
1. Allez sur `/agent/clients/ajouter`
2. Créez un nouveau client
3. Le client sera automatiquement assigné à l'agent connecté

### Solution 4 : Vérifier la console du navigateur

Ouvrez la console (F12) et regardez tous les messages d'erreur. Ils vous donneront des indices sur ce qui ne va pas.

## Messages d'erreur courants

### "Agent non trouvé. Veuillez vous reconnecter."
- **Cause** : `userInfo` n'a pas d'`idAgent` ou l'API ne retourne pas l'agent
- **Solution** : Reconnectez-vous en tant qu'agent

### "La réponse de getByAgent n'est pas un tableau"
- **Cause** : L'API retourne une structure différente
- **Solution** : Vérifiez la console pour voir ce que l'API retourne réellement

### Erreur 404
- **Cause** : L'endpoint n'existe pas ou l'agent ID est invalide
- **Solution** : Vérifiez que l'endpoint existe dans le backend

### Erreur 403
- **Cause** : Problème d'autorisation
- **Solution** : Vérifiez que votre token est valide et que vous avez les bonnes permissions

### Erreur 500
- **Cause** : Erreur côté serveur
- **Solution** : Vérifiez les logs du serveur Spring Boot
