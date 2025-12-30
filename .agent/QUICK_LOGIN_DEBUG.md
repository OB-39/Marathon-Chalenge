# 🧪 Test de connexion avec ID unique - Guide de diagnostic

## Problème

La connexion avec l'ID unique ne redirige pas vers le dashboard.

## Comment tester avec les nouveaux logs

### 1. Ouvrir la console

1. Ouvrez votre site : http://localhost:5173
2. Appuyez sur **F12**
3. Allez dans l'onglet **"Console"**

### 2. Se connecter avec l'ID

1. Allez sur `/quick-login` (ou cliquez sur "Se Connecter" depuis le Leaderboard)
2. Entrez votre ID unique (ex: MC-9416-8081)
3. Cliquez sur "Se Connecter"

### 3. Regarder les logs

Vous devriez voir dans la console :

```
🔍 [QUICK LOGIN] Recherche du profil avec ID: MC-XXXX-XXXX
🔍 [QUICK LOGIN] Profil trouvé: {id: "...", email: "...", ...}
🔍 [QUICK LOGIN] Erreur: null
✅ [QUICK LOGIN] Profil valide trouvé: USER_ID
✅ [QUICK LOGIN] Email: votre@email.com
✅ [QUICK LOGIN] Nom: Votre Nom
💾 [QUICK LOGIN] Session stockée dans sessionStorage
💾 [QUICK LOGIN] user_id: USER_ID
💾 [QUICK LOGIN] timestamp: 1234567890
🚀 [QUICK LOGIN] Redirection vers /dashboard...
```

Puis, quand vous arrivez sur `/dashboard` :

```
🛡️ [PROTECTED ROUTE] Vérification...
🛡️ [PROTECTED ROUTE] loading: false
🛡️ [PROTECTED ROUTE] user: {id: "...", email: "..."}
🛡️ [PROTECTED ROUTE] profile: {id: "...", full_name: "...", ...}
✅ [PROTECTED ROUTE] Accès autorisé au dashboard
```

## Diagnostic selon les logs

### Scénario 1 : Profil non trouvé

```
❌ [QUICK LOGIN] Profil non trouvé ou erreur
```

**Cause** : L'ID est invalide ou n'existe pas dans la base

**Solution** :
- Vérifiez que vous avez bien copié l'ID complet
- Vérifiez dans Supabase que l'ID existe :
  ```sql
  SELECT * FROM profiles WHERE unique_login_id = 'MC-XXXX-XXXX';
  ```

### Scénario 2 : Redirection vers /login

```
🚀 [QUICK LOGIN] Redirection vers /dashboard...
🛡️ [PROTECTED ROUTE] Vérification...
🛡️ [PROTECTED ROUTE] user: null
❌ [PROTECTED ROUTE] Pas d'utilisateur, redirection vers /login
```

**Cause** : AuthContext n'a pas chargé le profil depuis sessionStorage

**Solution** : Vérifier que AuthContext lit bien sessionStorage

**Debug** :
1. Dans la console, tapez :
   ```javascript
   sessionStorage.getItem('quick_login_user_id')
   ```
2. Vous devriez voir votre user ID
3. Si c'est `null`, le problème vient de QuickLogin

### Scénario 3 : Loading infini

```
🛡️ [PROTECTED ROUTE] Vérification...
🛡️ [PROTECTED ROUTE] loading: true
⏳ [PROTECTED ROUTE] Chargement en cours...
```

**Cause** : AuthContext est bloqué en état de chargement

**Solution** : Vérifier AuthContext.tsx

### Scénario 4 : Utilisateur non enregistré

```
🛡️ [PROTECTED ROUTE] user: {id: "..."}
🛡️ [PROTECTED ROUTE] profile: {is_registered: false}
⚠️ [PROTECTED ROUTE] Utilisateur non enregistré, redirection vers /onboarding
```

**Cause** : Le profil existe mais `is_registered = false`

**Solution** :
```sql
UPDATE profiles 
SET is_registered = true 
WHERE id = 'USER_ID';
```

## Vérifications manuelles

### Vérifier sessionStorage

Dans la console :

```javascript
// Vérifier que la session est stockée
console.log('user_id:', sessionStorage.getItem('quick_login_user_id'));
console.log('timestamp:', sessionStorage.getItem('quick_login_timestamp'));
```

### Vérifier AuthContext

Dans la console, après avoir essayé de vous connecter :

```javascript
// Vérifier l'état de AuthContext
// (Vous devriez voir les logs automatiquement)
```

### Vérifier le profil dans Supabase

```sql
SELECT 
    id, 
    email, 
    full_name, 
    unique_login_id, 
    is_registered 
FROM profiles 
WHERE unique_login_id = 'MC-XXXX-XXXX';
```

**Résultat attendu** :
- `unique_login_id` : MC-XXXX-XXXX
- `is_registered` : true

## Checklist de dépannage

- [ ] Ouvrir la console (F12)
- [ ] Essayer de se connecter avec l'ID
- [ ] Voir les logs `[QUICK LOGIN]`
- [ ] Voir les logs `[PROTECTED ROUTE]`
- [ ] Vérifier sessionStorage
- [ ] Vérifier que `user` n'est pas `null`
- [ ] Vérifier que `is_registered = true`

## Partagez ces informations

Si le problème persiste, partagez :

1. **Tous les logs** de la console (de `[QUICK LOGIN]` à `[PROTECTED ROUTE]`)
2. **Le résultat** de `sessionStorage.getItem('quick_login_user_id')`
3. **Le résultat** de la requête SQL pour vérifier le profil

---

**Note** : Les logs sont maintenant très détaillés. Vous saurez exactement où est le problème !
