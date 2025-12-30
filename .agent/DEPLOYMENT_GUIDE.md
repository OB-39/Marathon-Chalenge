# 🚀 Guide de déploiement rapide - Système d'identifiant unique

## Étapes à suivre

### 1. Accéder à Supabase
1. Ouvrez votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet "Marathon Challenge"
3. Allez dans **SQL Editor** (dans le menu de gauche)

### 2. Exécuter le script SQL
1. Cliquez sur **"New Query"**
2. Copiez le contenu du fichier `.agent/add-unique-login-id.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **"Run"** (ou appuyez sur Ctrl+Enter)

### 3. Vérifier l'exécution
Après l'exécution, vous devriez voir :
- ✅ "Success. No rows returned"
- Ou un message indiquant que les modifications ont été appliquées

### 4. Vérifier la colonne
Pour vérifier que la colonne a été ajoutée :
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'unique_login_id';
```

### 5. Vérifier les identifiants générés
Pour voir les identifiants générés pour les profils existants :
```sql
SELECT id, full_name, email, unique_login_id, is_registered
FROM profiles
WHERE is_registered = true
ORDER BY created_at DESC
LIMIT 10;
```

## 🎯 Test du système

### Test 1 : Nouvelle inscription
1. Ouvrez l'application en mode navigation privée
2. Allez sur `/leaderboard`
3. Cliquez sur "Participer au Challenge"
4. Complétez l'inscription
5. Vérifiez que le modal avec l'identifiant unique s'affiche
6. Notez l'identifiant (ex: MC-1234-5678)

### Test 2 : Connexion avec identifiant
1. Déconnectez-vous (ou ouvrez un nouvel onglet en navigation privée)
2. Allez sur `/leaderboard`
3. Cliquez sur "Se Connecter"
4. Entrez l'identifiant unique noté précédemment
5. Vérifiez que vous êtes redirigé vers le dashboard

## ⚠️ Points d'attention

### Permissions RLS (Row Level Security)
Assurez-vous que vos politiques RLS permettent :
```sql
-- Lecture du unique_login_id pour tous
CREATE POLICY "Anyone can read unique_login_id" ON profiles
FOR SELECT USING (true);

-- Ou si vous voulez restreindre :
CREATE POLICY "Authenticated users can read unique_login_id" ON profiles
FOR SELECT TO authenticated USING (true);
```

### Vérifier les politiques existantes
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 🔧 Dépannage

### Erreur : "column already exists"
Si vous voyez cette erreur, la colonne existe déjà. Vous pouvez :
1. Ignorer cette partie du script
2. Ou supprimer la colonne et relancer :
```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS unique_login_id;
```

### Erreur : "function already exists"
```sql
DROP FUNCTION IF EXISTS generate_unique_login_id();
DROP FUNCTION IF EXISTS set_unique_login_id();
```
Puis relancez le script.

### Les identifiants ne sont pas générés automatiquement
Vérifiez que le trigger existe :
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
```

## 📊 Requêtes utiles

### Compter les profils avec identifiant
```sql
SELECT 
  COUNT(*) as total_profiles,
  COUNT(unique_login_id) as profiles_with_id,
  COUNT(*) - COUNT(unique_login_id) as profiles_without_id
FROM profiles;
```

### Générer des identifiants pour les profils existants sans ID
```sql
UPDATE profiles 
SET unique_login_id = generate_unique_login_id()
WHERE unique_login_id IS NULL AND is_registered = true;
```

### Voir tous les identifiants
```sql
SELECT full_name, email, unique_login_id, created_at
FROM profiles
WHERE unique_login_id IS NOT NULL
ORDER BY created_at DESC;
```

## ✅ Checklist finale

- [ ] Script SQL exécuté sans erreur
- [ ] Colonne `unique_login_id` présente dans la table `profiles`
- [ ] Fonction `generate_unique_login_id()` créée
- [ ] Trigger `trigger_set_unique_login_id` créé
- [ ] Identifiants générés pour les profils existants
- [ ] Test de nouvelle inscription réussi
- [ ] Test de connexion avec identifiant réussi
- [ ] Modal d'affichage de l'identifiant fonctionne
- [ ] Page `/quick-login` accessible

## 🎉 Félicitations !

Si tous les tests passent, votre système d'identifiant unique est opérationnel ! 

Les participants peuvent maintenant :
- ✅ S'inscrire et recevoir un identifiant unique
- ✅ Se connecter facilement avec cet identifiant
- ✅ Accéder à leur dashboard sans Google OAuth à chaque fois
