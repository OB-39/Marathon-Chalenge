# 🚀 Guide de Déploiement - Système de Deadline

## ⚡ Déploiement Rapide (Quick Start)

### **Étape 1 : Migration de la Base de Données**

```bash
# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref YOUR_PROJECT_REF

# Exécuter la migration
supabase db push
```

Ou manuellement dans le **SQL Editor** de Supabase :
1. Ouvrir Supabase Dashboard
2. Aller dans **SQL Editor**
3. Copier-coller le contenu de `supabase/migrations/add_deadline_system.sql`
4. Exécuter

### **Étape 2 : Configurer la Date de Début**

```sql
-- Modifier la date de début du challenge
UPDATE challenge_config
SET challenge_start_date = '2025-01-15 00:00:00+00'  -- MODIFIER ICI
WHERE id = (SELECT id FROM challenge_config LIMIT 1);

-- Recalculer toutes les deadlines
DO $$
DECLARE
    config_start_date TIMESTAMPTZ;
    config_deadline_hours INTEGER;
BEGIN
    SELECT challenge_start_date, deadline_hours 
    INTO config_start_date, config_deadline_hours
    FROM challenge_config 
    LIMIT 1;

    FOR i IN 1..15 LOOP
        UPDATE challenge_days
        SET 
            start_date = config_start_date + ((i - 1) * INTERVAL '1 day'),
            deadline = config_start_date + ((i - 1) * INTERVAL '1 day') + (config_deadline_hours * INTERVAL '1 hour'),
            is_expired = FALSE
        WHERE day_number = i;
    END LOOP;
END $$;
```

### **Étape 3 : Déployer la Edge Function**

```bash
# Déployer la fonction
supabase functions deploy process-daily-deadlines

# Vérifier le déploiement
supabase functions list
```

### **Étape 4 : Configurer le Cron Job**

Dans **Supabase Dashboard** :

1. Aller dans **Edge Functions** → **Cron Jobs**
2. Cliquer sur **Create a new cron job**
3. Configurer :
   - **Name** : `process-daily-deadlines`
   - **Schedule** : `0 * * * *` (toutes les heures)
   - **Function** : `process-daily-deadlines`
4. Sauvegarder

### **Étape 5 : Tester**

```bash
# Tester la fonction manuellement
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-daily-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Vérifier les logs
supabase functions logs process-daily-deadlines --tail
```

---

## 📋 Checklist de Déploiement

### **Avant le Lancement**

- [ ] Migration SQL exécutée avec succès
- [ ] Date de début du challenge configurée
- [ ] Deadlines calculées pour les 15 jours
- [ ] Edge function déployée
- [ ] Cron job configuré
- [ ] Tests effectués en environnement de staging
- [ ] Documentation utilisateur mise à jour
- [ ] Participants informés du système de deadline

### **Vérifications**

```sql
-- Vérifier la configuration
SELECT * FROM challenge_config;

-- Vérifier les deadlines
SELECT 
    day_number,
    theme_title,
    start_date AT TIME ZONE 'UTC' as start_utc,
    deadline AT TIME ZONE 'UTC' as deadline_utc,
    EXTRACT(EPOCH FROM (deadline - start_date))/3600 as hours,
    is_active,
    is_expired
FROM challenge_days
ORDER BY day_number;

-- Vérifier qu'aucun jour n'est déjà expiré (avant le lancement)
SELECT COUNT(*) as expired_days
FROM challenge_days
WHERE is_expired = TRUE;
-- Devrait retourner 0
```

---

## 🧪 Tests

### **Test 1 : Vérifier les Deadlines**

```sql
-- Afficher toutes les deadlines en heure locale (exemple : Paris)
SELECT 
    day_number,
    start_date AT TIME ZONE 'Europe/Paris' as debut_paris,
    deadline AT TIME ZONE 'Europe/Paris' as deadline_paris,
    EXTRACT(EPOCH FROM (deadline - start_date))/3600 as heures_allouees
FROM challenge_days
ORDER BY day_number;
```

### **Test 2 : Simuler une Deadline Expirée**

```sql
-- ATTENTION : Test uniquement, ne pas faire en production !

-- Créer un jour de test avec deadline expirée
INSERT INTO challenge_days (day_number, theme_title, description, is_active, start_date, deadline, is_expired)
VALUES (
    99, 
    'Test Day', 
    'Test deadline system', 
    TRUE,
    NOW() - INTERVAL '30 hours',
    NOW() - INTERVAL '1 hour',
    FALSE
);

-- Exécuter la edge function manuellement
-- Elle devrait traiter le jour 99

-- Vérifier les résultats
SELECT * FROM submissions WHERE day_number = 99 AND missed_deadline = TRUE;

-- Nettoyer
DELETE FROM submissions WHERE day_number = 99;
DELETE FROM challenge_days WHERE day_number = 99;
```

### **Test 3 : Tester le Countdown Frontend**

1. Modifier temporairement un jour pour avoir une deadline dans 1 heure
2. Rafraîchir le dashboard
3. Vérifier que le countdown s'affiche
4. Vérifier l'alerte "urgent" quand < 3h
5. Remettre la vraie deadline

---

## 🔧 Configuration Avancée

### **Modifier la Durée de la Fenêtre**

Si vous voulez changer de 29h à une autre durée :

```sql
-- Exemple : passer à 36 heures (24h + 12h)
UPDATE challenge_config
SET deadline_hours = 36;

-- Recalculer les deadlines
-- (utiliser le script de l'Étape 2)
```

### **Désactiver le Système Temporairement**

```sql
-- Désactiver la progression automatique
UPDATE challenge_config
SET auto_progress = FALSE;

-- Les deadlines continueront d'être calculées mais
-- la edge function ne créera pas de soumissions automatiques
-- (nécessite modification du code de la edge function)
```

---

## 🐛 Dépannage

### **Problème : La Edge Function ne s'exécute pas**

```bash
# Vérifier les logs
supabase functions logs process-daily-deadlines --tail

# Vérifier que le cron job est actif
# Dans Dashboard → Edge Functions → Cron Jobs

# Tester manuellement
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-daily-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -v
```

### **Problème : Les Deadlines ne sont pas Correctes**

```sql
-- Vérifier la configuration
SELECT * FROM challenge_config;

-- Vérifier le fuseau horaire
SHOW timezone;

-- Recalculer manuellement
-- (utiliser le script de l'Étape 2)
```

### **Problème : Trop de Participants Reçoivent 0 Points**

```sql
-- Vérifier les soumissions manquées récentes
SELECT 
    s.day_number,
    p.full_name,
    p.email,
    s.created_at,
    s.feedback
FROM submissions s
JOIN profiles p ON s.user_id = p.id
WHERE s.missed_deadline = TRUE
ORDER BY s.created_at DESC
LIMIT 20;

-- Vérifier si la deadline était correcte
SELECT day_number, deadline, is_expired
FROM challenge_days
WHERE day_number = X; -- Remplacer X par le jour concerné
```

---

## 📊 Monitoring

### **Requêtes Utiles**

```sql
-- Statistiques des deadlines manquées
SELECT 
    day_number,
    COUNT(*) as missed_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles WHERE role = 'student' AND is_registered = TRUE), 2) as percentage
FROM submissions
WHERE missed_deadline = TRUE
GROUP BY day_number
ORDER BY day_number;

-- Participants avec le plus de deadlines manquées
SELECT 
    p.full_name,
    p.email,
    COUNT(*) as missed_count
FROM submissions s
JOIN profiles p ON s.user_id = p.id
WHERE s.missed_deadline = TRUE
GROUP BY p.id, p.full_name, p.email
ORDER BY missed_count DESC
LIMIT 10;

-- Jours avec le plus de deadlines manquées
SELECT 
    cd.day_number,
    cd.theme_title,
    COUNT(s.id) as missed_count
FROM challenge_days cd
LEFT JOIN submissions s ON cd.day_number = s.day_number AND s.missed_deadline = TRUE
GROUP BY cd.day_number, cd.theme_title
ORDER BY missed_count DESC;
```

---

## 🔄 Rollback

Si vous devez annuler le système de deadline :

```sql
-- ATTENTION : Ceci supprimera toutes les données de deadline !

-- 1. Supprimer les soumissions automatiques
DELETE FROM submissions WHERE missed_deadline = TRUE;

-- 2. Supprimer la table de configuration
DROP TABLE IF EXISTS challenge_config CASCADE;

-- 3. Supprimer les colonnes
ALTER TABLE challenge_days DROP COLUMN IF EXISTS start_date;
ALTER TABLE challenge_days DROP COLUMN IF EXISTS deadline;
ALTER TABLE challenge_days DROP COLUMN IF EXISTS is_expired;
ALTER TABLE submissions DROP COLUMN IF EXISTS missed_deadline;

-- 4. Supprimer les fonctions
DROP FUNCTION IF EXISTS calculate_day_deadline(INTEGER, TIMESTAMPTZ, INTEGER);
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 5. Supprimer les index
DROP INDEX IF EXISTS idx_challenge_days_deadline;
DROP INDEX IF EXISTS idx_submissions_missed;
```

---

## 📞 Support

En cas de problème :

1. Vérifier les logs de la edge function
2. Vérifier les données dans la base de données
3. Consulter la documentation complète dans `.agent/DEADLINE_SYSTEM.md`
4. Tester en environnement de staging avant production

---

## 🎯 Prochaines Étapes

Après le déploiement :

1. **Monitoring** : Surveiller les logs quotidiennement
2. **Communication** : Informer les participants du système
3. **Ajustements** : Collecter les feedbacks et ajuster si nécessaire
4. **Notifications** : Implémenter les rappels avant deadline (optionnel)
