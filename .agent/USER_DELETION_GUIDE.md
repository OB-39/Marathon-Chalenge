# 🔧 Guide : Résoudre les problèmes de suppression d'utilisateurs Supabase

## 🎯 Problème

Vous ne pouvez pas supprimer des utilisateurs depuis votre dashboard Supabase.

## 🔍 Diagnostic

### Étape 1 : Identifier la cause

Connectez-vous à Supabase et allez dans **SQL Editor**, puis exécutez :

```sql
-- Voir les contraintes de clé étrangère
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'profiles';
```

**Résultat attendu** : Vous verrez probablement :
- `submissions` → `user_id` → `profiles.id`
- `announcements` → `ambassador_id` → `profiles.id`

**Problème** : Ces contraintes empêchent la suppression car des données liées existent.

---

## ✅ Solutions (3 options)

### Option 1 : Suppression CASCADE (Recommandé) ⭐

Cette option supprime automatiquement toutes les données liées.

**Avantages** :
- ✅ Automatique
- ✅ Propre
- ✅ Pas de données orphelines

**Inconvénients** :
- ⚠️ Supprime TOUTES les données liées (submissions, annonces, etc.)

**Comment faire** :

```sql
-- 1. Supprimer les anciennes contraintes
ALTER TABLE submissions 
DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;

ALTER TABLE announcements 
DROP CONSTRAINT IF EXISTS announcements_ambassador_id_fkey;

-- 2. Recréer avec CASCADE
ALTER TABLE submissions
ADD CONSTRAINT submissions_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE announcements
ADD CONSTRAINT announcements_ambassador_id_fkey 
FOREIGN KEY (ambassador_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;
```

**Après cela**, vous pourrez supprimer des utilisateurs directement depuis le dashboard !

---

### Option 2 : Fonction de suppression manuelle

Créez une fonction qui supprime d'abord les données liées, puis l'utilisateur.

```sql
CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS void AS $$
BEGIN
    -- Supprimer les soumissions
    DELETE FROM submissions WHERE user_id = user_id_to_delete;
    
    -- Supprimer les annonces
    DELETE FROM announcements WHERE ambassador_id = user_id_to_delete;
    
    -- Supprimer le profil
    DELETE FROM profiles WHERE id = user_id_to_delete;
    
    RAISE NOTICE 'User deleted successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Utilisation** :
```sql
-- Remplacez USER_ID par l'ID réel
SELECT delete_user_completely('USER_ID_HERE');
```

---

### Option 3 : Suppression manuelle étape par étape

Si vous voulez supprimer un utilisateur spécifique manuellement :

```sql
-- 1. Trouver l'ID de l'utilisateur
SELECT id, full_name, email FROM profiles WHERE email = 'user@example.com';

-- 2. Supprimer ses soumissions
DELETE FROM submissions WHERE user_id = 'USER_ID_HERE';

-- 3. Supprimer ses annonces (si ambassadeur)
DELETE FROM announcements WHERE ambassador_id = 'USER_ID_HERE';

-- 4. Supprimer le profil
DELETE FROM profiles WHERE id = 'USER_ID_HERE';

-- 5. (Optionnel) Supprimer de auth.users
DELETE FROM auth.users WHERE id = 'USER_ID_HERE';
```

---

## 🚀 Méthode recommandée (Rapide)

### Pour résoudre immédiatement :

1. **Ouvrez Supabase Dashboard**
2. **Allez dans SQL Editor**
3. **Copiez-collez ce script** :

```sql
-- Solution complète en une fois
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_ambassador_id_fkey;

ALTER TABLE submissions
ADD CONSTRAINT submissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE announcements
ADD CONSTRAINT announcements_ambassador_id_fkey 
FOREIGN KEY (ambassador_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

4. **Cliquez sur "Run"**
5. **Testez** : Essayez de supprimer un utilisateur depuis le dashboard

---

## 🔒 Vérifier les politiques RLS

Si le problème persiste, vérifiez les politiques :

```sql
-- Voir les politiques sur profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**Ajouter une politique de suppression** (si nécessaire) :

```sql
-- Pour les ambassadeurs
CREATE POLICY "Ambassadors can delete profiles" ON profiles
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'ambassador'
    )
);
```

---

## 📊 Vérifications utiles

### Voir combien d'utilisateurs ont des données liées :

```sql
SELECT 
    p.full_name,
    p.email,
    COUNT(DISTINCT s.id) as submissions,
    COUNT(DISTINCT a.id) as announcements
FROM profiles p
LEFT JOIN submissions s ON s.user_id = p.id
LEFT JOIN announcements a ON a.ambassador_id = p.id
GROUP BY p.id, p.full_name, p.email
HAVING COUNT(DISTINCT s.id) > 0 OR COUNT(DISTINCT a.id) > 0;
```

### Nettoyer les profils non enregistrés :

```sql
DELETE FROM profiles WHERE is_registered = false;
```

---

## ⚠️ Attention

### Avant de supprimer en masse :

1. **Faites une sauvegarde** de votre base de données
2. **Testez sur un seul utilisateur** d'abord
3. **Vérifiez les données** que vous allez perdre

### Données qui seront supprimées avec CASCADE :

- ✅ Profil de l'utilisateur
- ✅ Toutes ses soumissions
- ✅ Toutes ses annonces (si ambassadeur)
- ✅ Historique complet

---

## 🎯 Résumé rapide

**Problème** : Contraintes de clé étrangère empêchent la suppression

**Solution la plus simple** :
1. Exécutez le script de CASCADE (Option 1)
2. Supprimez depuis le dashboard

**Solution la plus sûre** :
1. Utilisez la fonction `delete_user_completely()`
2. Supprimez un par un

---

## 📞 Besoin d'aide ?

Si le problème persiste :

1. Vérifiez les **logs d'erreur** dans Supabase
2. Vérifiez les **politiques RLS**
3. Vérifiez les **triggers** actifs
4. Contactez le support Supabase

---

**Fichier complet** : `.agent/fix-user-deletion.sql`

**Status** : ✅ Prêt à exécuter
