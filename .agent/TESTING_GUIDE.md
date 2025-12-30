# 🧪 Guide de test - Système d'identifiant unique

## ⚠️ IMPORTANT : Avant de tester

### 1. Exécuter le script SQL sur Supabase

**VOUS DEVEZ FAIRE CECI EN PREMIER** sinon rien ne fonctionnera !

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Ouvrez le fichier `.agent/verify-unique-id-setup.sql`
5. Copiez la section "SI RIEN N'APPARAÎT, EXÉCUTEZ CECI"
6. Collez dans SQL Editor
7. Cliquez sur **"Run"**

### 2. Vérifier que ça a fonctionné

Exécutez cette requête :

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'unique_login_id';
```

**Résultat attendu** : Vous devez voir `unique_login_id`

Si vous ne voyez rien, le script n'a pas été exécuté correctement !

---

## 🧪 Test 1 : Nouvelle inscription

### Étapes :

1. **Ouvrez le site** en mode navigation privée
2. **Allez sur** `/leaderboard`
3. **Cliquez sur** "Participer au Challenge"
4. **Connectez-vous** avec Google
5. **Remplissez** le formulaire d'inscription (Onboarding)
6. **Cliquez sur** "Commencer le Challenge 🚀"

### ✅ Résultat attendu :

- ✅ Animation confetti
- ✅ **Modal s'affiche** avec votre identifiant unique (ex: MC-1234-5678)
- ✅ Bouton "Copier" fonctionne
- ✅ Instructions claires affichées

### ❌ Si le modal ne s'affiche PAS :

**Cause probable** : Le script SQL n'a pas été exécuté

**Solution** :
1. Ouvrez la console navigateur (F12)
2. Regardez les erreurs
3. Vérifiez que la colonne `unique_login_id` existe dans Supabase
4. Exécutez le script SQL (voir section "IMPORTANT" ci-dessus)

---

## 🧪 Test 2 : Connexion avec identifiant

### Étapes :

1. **Notez** votre identifiant du Test 1 (ex: MC-1234-5678)
2. **Fermez** le modal
3. **Déconnectez-vous** (cliquez sur votre profil → Déconnexion)
4. **Allez sur** `/leaderboard`
5. **Cliquez sur** "Se Connecter"
6. **Entrez** votre identifiant unique
7. **Cliquez sur** "Se Connecter"

### ✅ Résultat attendu :

- ✅ Redirection vers `/dashboard`
- ✅ Dashboard s'affiche avec vos données
- ✅ Votre nom et photo de profil visibles
- ✅ Vos statistiques affichées

### ❌ Si vous êtes redirigé vers `/login` :

**Cause** : Problème de session

**Solution** :
1. Ouvrez la console navigateur (F12)
2. Tapez : `sessionStorage.getItem('quick_login_user_id')`
3. Vous devriez voir votre ID utilisateur
4. Si c'est `null`, le problème vient de QuickLogin.tsx

---

## 🧪 Test 3 : Vérifier dans la base de données

### Dans Supabase SQL Editor :

```sql
-- Voir tous les profils avec leur ID unique
SELECT 
    id, 
    full_name, 
    email, 
    unique_login_id, 
    is_registered,
    created_at
FROM profiles
WHERE is_registered = true
ORDER BY created_at DESC
LIMIT 10;
```

### ✅ Résultat attendu :

- ✅ Votre profil apparaît
- ✅ `unique_login_id` est rempli (ex: MC-1234-5678)
- ✅ `is_registered` = true

### ❌ Si `unique_login_id` est NULL :

**Cause** : Le trigger ne fonctionne pas

**Solution** :
```sql
-- Générer manuellement l'ID
UPDATE profiles 
SET unique_login_id = generate_unique_login_id()
WHERE id = 'VOTRE_USER_ID' AND unique_login_id IS NULL;
```

---

## 🧪 Test 4 : Identifiant invalide

### Étapes :

1. **Allez sur** `/quick-login`
2. **Entrez** un identifiant invalide (ex: MC-9999-9999)
3. **Cliquez sur** "Se Connecter"

### ✅ Résultat attendu :

- ✅ Message d'erreur : "Identifiant invalide..."
- ✅ Pas de redirection
- ✅ Reste sur la page de connexion

---

## 🧪 Test 5 : Session persistante

### Étapes :

1. **Connectez-vous** avec votre identifiant (Test 2)
2. **Allez sur** `/dashboard`
3. **Rafraîchissez** la page (F5)

### ✅ Résultat attendu :

- ✅ Vous restez connecté
- ✅ Dashboard se recharge avec vos données
- ✅ Pas de redirection vers `/login`

### ❌ Si vous êtes déconnecté :

**Cause** : Session expirée ou problème AuthContext

**Solution** :
1. Vérifiez la console : `sessionStorage.getItem('quick_login_timestamp')`
2. La session dure 24h
3. Si le timestamp est trop vieux, reconnectez-vous

---

## 🧪 Test 6 : Déconnexion

### Étapes :

1. **Connecté au dashboard**
2. **Cliquez** sur votre profil (en haut à droite)
3. **Cliquez** sur "Déconnexion"

### ✅ Résultat attendu :

- ✅ Redirection vers `/leaderboard`
- ✅ Bouton "Se Connecter" visible
- ✅ Plus de profil affiché

---

## 🧪 Test 7 : Copie de l'identifiant

### Étapes :

1. **Nouvelle inscription** (Test 1)
2. **Modal s'affiche** avec l'ID
3. **Cliquez** sur le bouton "Copier"
4. **Collez** dans un éditeur de texte (Ctrl+V)

### ✅ Résultat attendu :

- ✅ Bouton affiche "Copié !" pendant 2 secondes
- ✅ L'ID est bien copié dans le presse-papier
- ✅ Format correct : MC-XXXX-XXXX

---

## 📊 Checklist complète

Avant de considérer le système comme fonctionnel :

- [ ] Script SQL exécuté sur Supabase
- [ ] Colonne `unique_login_id` existe
- [ ] Fonction `generate_unique_login_id()` existe
- [ ] Trigger `trigger_set_unique_login_id` existe
- [ ] Test 1 : Modal s'affiche après inscription ✅
- [ ] Test 2 : Connexion avec ID fonctionne ✅
- [ ] Test 3 : ID visible dans la base de données ✅
- [ ] Test 4 : Erreur pour ID invalide ✅
- [ ] Test 5 : Session persiste après rafraîchissement ✅
- [ ] Test 6 : Déconnexion fonctionne ✅
- [ ] Test 7 : Copie de l'ID fonctionne ✅

---

## 🐛 Problèmes courants

### Problème : "Cannot read property 'unique_login_id' of null"

**Cause** : Le profil n'a pas d'ID unique

**Solution** :
```sql
UPDATE profiles 
SET unique_login_id = generate_unique_login_id()
WHERE unique_login_id IS NULL AND is_registered = true;
```

### Problème : "Redirection infinie vers /login"

**Cause** : AuthContext ne trouve pas de session

**Solution** :
1. Vérifiez `sessionStorage` dans la console
2. Reconnectez-vous avec l'ID
3. Vérifiez les logs de la console

### Problème : "Modal ne s'affiche jamais"

**Cause** : Script SQL non exécuté OU erreur dans Onboarding

**Solution** :
1. Vérifiez la console navigateur
2. Exécutez le script SQL
3. Vérifiez que `showUniqueIdModal` est bien à `true`

---

## 📝 Logs à vérifier

Dans la console navigateur, vous devriez voir :

```
✅ Profile loaded: {id: "...", unique_login_id: "MC-1234-5678", ...}
🔑 Quick login session found
✅ Quick login profile loaded: {...}
```

Si vous voyez des ❌, il y a un problème !

---

## 🎉 Succès !

Si tous les tests passent, votre système d'identifiant unique est **100% fonctionnel** ! 🚀

Les participants peuvent maintenant :
- ✅ S'inscrire et recevoir un ID unique
- ✅ Se connecter avec cet ID
- ✅ Accéder à leur dashboard
- ✅ Rester connectés pendant 24h

---

**Créé le** : 30 décembre 2025
**Version** : 2.0.0 (avec support session rapide)
