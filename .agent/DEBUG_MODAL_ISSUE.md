# 🔍 Script de diagnostic - Modal ne s'affiche pas

## Problème

Le modal avec l'ID unique ne s'affiche pas après l'inscription.

## Diagnostic rapide

### Option 1 : Vérifier dans la console navigateur (RECOMMANDÉ)

1. **Ouvrez votre site** : http://localhost:5173
2. **Ouvrez la console** : Appuyez sur F12
3. **Allez dans l'onglet "Console"**
4. **Faites une inscription** et regardez les logs

**Logs attendus** :
```
✅ Profile loaded: {id: "...", unique_login_id: "MC-1234-5678", ...}
```

**Si vous voyez** :
```
✅ Profile loaded: {id: "...", unique_login_id: null, ...}
```
→ **Le script SQL n'a PAS été exécuté !**

### Option 2 : Vérifier directement dans Supabase

1. **Ouvrez Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionnez votre projet**
3. **Allez dans "Table Editor"**
4. **Cliquez sur la table "profiles"**
5. **Regardez les colonnes** : Y a-t-il une colonne `unique_login_id` ?

**Si NON** → Le script SQL n'a PAS été exécuté !

### Option 3 : Exécuter une requête SQL

1. **Supabase Dashboard** → **SQL Editor**
2. **Exécutez cette requête** :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'unique_login_id';
```

**Résultat attendu** : `unique_login_id`
**Si vide** → Le script SQL n'a PAS été exécuté !

## Solution : Exécuter le script SQL

### Étape 1 : Copier le script

Ouvrez le fichier `.agent/verify-unique-id-setup.sql` et copiez **TOUT** le contenu de la section :

```sql
-- ============================================
-- SI RIEN N'APPARAÎT, EXÉCUTEZ CECI :
-- ============================================
```

Jusqu'à la fin du fichier.

### Étape 2 : Exécuter dans Supabase

1. **Supabase Dashboard** → **SQL Editor**
2. **New Query**
3. **Collez** le script copié
4. **Run** (ou Ctrl+Enter)

### Étape 3 : Vérifier

Exécutez cette requête pour vérifier :

```sql
SELECT id, full_name, email, unique_login_id, is_registered
FROM profiles
WHERE is_registered = true
ORDER BY created_at DESC
LIMIT 5;
```

**Vous devriez voir** :
- Vos profils avec `unique_login_id` rempli (ex: MC-1234-5678)

## Modification temporaire pour debug

Si vous voulez voir exactement ce qui se passe, modifiez temporairement `Onboarding.tsx` :

### Ligne 132-141, remplacez par :

```typescript
// Afficher le modal avec l'identifiant unique
console.log('🔍 DEBUG - updatedProfile:', updatedProfile);
console.log('🔍 DEBUG - unique_login_id:', updatedProfile?.unique_login_id);

if (updatedProfile?.unique_login_id) {
    console.log('✅ ID trouvé, affichage du modal');
    setUniqueLoginId(updatedProfile.unique_login_id);
    setShowUniqueIdModal(true);
} else {
    console.log('❌ Pas d\'ID trouvé, redirection vers dashboard');
    console.log('🔍 Raison: updatedProfile =', updatedProfile);
    // Si pas d'identifiant, rediriger directement
    setTimeout(() => {
        navigate('/dashboard');
    }, 1000);
}
```

Puis **refaites une inscription** et regardez la console.

## Vérification finale

Après avoir exécuté le script SQL, vérifiez que :

1. ✅ La colonne `unique_login_id` existe dans la table `profiles`
2. ✅ La fonction `generate_unique_login_id()` existe
3. ✅ Le trigger `trigger_set_unique_login_id` existe

**Requête pour tout vérifier d'un coup** :

```sql
-- Vérifier la colonne
SELECT 'Colonne existe' as check_type, 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'profiles' AND column_name = 'unique_login_id'
       ) THEN '✅ OUI' ELSE '❌ NON' END as result
UNION ALL
-- Vérifier la fonction
SELECT 'Fonction existe', 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'generate_unique_login_id'
       ) THEN '✅ OUI' ELSE '❌ NON' END
UNION ALL
-- Vérifier le trigger
SELECT 'Trigger existe', 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.triggers 
           WHERE trigger_name = 'trigger_set_unique_login_id'
       ) THEN '✅ OUI' ELSE '❌ NON' END;
```

**Résultat attendu** :
```
Colonne existe  | ✅ OUI
Fonction existe | ✅ OUI
Trigger existe  | ✅ OUI
```

Si vous voyez des ❌ NON, le script SQL n'a pas été exécuté correctement !

## Checklist de dépannage

- [ ] Ouvrir la console navigateur (F12)
- [ ] Faire une inscription
- [ ] Regarder les logs : `unique_login_id` est-il NULL ?
- [ ] Si NULL → Aller sur Supabase
- [ ] Vérifier que la colonne existe
- [ ] Si elle n'existe pas → Exécuter le script SQL
- [ ] Vérifier avec la requête de vérification finale
- [ ] Refaire une inscription
- [ ] Le modal devrait s'afficher !

## Si ça ne fonctionne toujours pas

Partagez les informations suivantes :

1. **Logs de la console** lors de l'inscription
2. **Résultat de la requête** de vérification finale
3. **Screenshot** de la table `profiles` dans Supabase

---

**Astuce** : Le problème est à 99% que le script SQL n'a pas été exécuté. Une fois exécuté, tout devrait fonctionner !
