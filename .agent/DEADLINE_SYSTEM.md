# Système de Deadline Automatique - Marathon Challenge

## 📋 Vue d'Ensemble

Implémentation d'un système de deadline automatique pour le Marathon Challenge :
- **Délai** : 24h + 5h de grâce = **29 heures** par jour
- **Pénalité** : 0 points automatiques pour les soumissions manquées
- **Progression** : Passage automatique au jour suivant après expiration

---

## 🎯 Objectifs

1. **Maintenir le rythme** : Assurer que le challenge progresse quotidiennement
2. **Équité** : Tous les participants ont le même délai
3. **Automatisation** : Pas d'intervention manuelle nécessaire
4. **Transparence** : Les participants voient clairement les deadlines

---

## 🏗️ Architecture du Système

### **Composants Principaux**

```
┌─────────────────────────────────────────────────────┐
│                  SYSTÈME DE DEADLINE                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Base de Données                                 │
│     ├─ challenge_days (start_date, deadline)       │
│     └─ submissions (missed_deadline flag)          │
│                                                     │
│  2. Edge Function (Supabase)                        │
│     ├─ Exécution quotidienne (cron)                │
│     ├─ Vérification des deadlines                  │
│     └─ Attribution de 0 points                     │
│                                                     │
│  3. Frontend (React)                                │
│     ├─ Compte à rebours en temps réel              │
│     ├─ Affichage des deadlines                     │
│     └─ Notifications avant expiration              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Modifications de la Base de Données

### **1. Table `challenge_days`**

Ajouter les champs suivants :

```sql
-- Ajouter les colonnes pour gérer les deadlines
ALTER TABLE challenge_days
ADD COLUMN start_date TIMESTAMPTZ,
ADD COLUMN deadline TIMESTAMPTZ,
ADD COLUMN is_expired BOOLEAN DEFAULT FALSE;

-- Exemple de données
-- Jour 1 : Commence le 1er janvier 2025 à 00:00
-- Deadline : 2 janvier 2025 à 05:00 (24h + 5h)
```

**Champs** :
- `start_date` : Date et heure de début du jour
- `deadline` : Date et heure limite de soumission (start_date + 29h)
- `is_expired` : Indique si la deadline est passée

### **2. Table `submissions`**

Ajouter un champ pour marquer les soumissions manquées :

```sql
-- Ajouter une colonne pour les deadlines manquées
ALTER TABLE submissions
ADD COLUMN missed_deadline BOOLEAN DEFAULT FALSE;

-- Modifier le statut pour inclure 'missed'
-- Alternative : utiliser status = 'rejected' avec score_awarded = 0
```

**Nouveau statut possible** :
- Option 1 : Ajouter `status = 'missed'` pour les deadlines manquées
- Option 2 : Utiliser `status = 'rejected'` avec `score_awarded = 0` et `missed_deadline = TRUE`

### **3. Table `challenge_config` (Nouvelle)**

Créer une table pour la configuration globale :

```sql
CREATE TABLE challenge_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_start_date TIMESTAMPTZ NOT NULL,
    deadline_hours INTEGER DEFAULT 29, -- 24h + 5h
    auto_progress BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer la configuration par défaut
INSERT INTO challenge_config (challenge_start_date, deadline_hours)
VALUES ('2025-01-01 00:00:00+00', 29);
```

---

## ⚙️ Edge Function Supabase

### **Fichier : `supabase/functions/process-daily-deadlines/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = new Date()
    console.log(`🕐 Processing deadlines at ${now.toISOString()}`)

    // 1. Trouver les jours dont la deadline est expirée
    const { data: expiredDays, error: daysError } = await supabaseClient
      .from('challenge_days')
      .select('*')
      .lte('deadline', now.toISOString())
      .eq('is_expired', false)

    if (daysError) throw daysError

    console.log(`📅 Found ${expiredDays?.length || 0} expired days`)

    for (const day of expiredDays || []) {
      console.log(`⏰ Processing Day ${day.day_number}`)

      // 2. Récupérer tous les participants actifs
      const { data: participants, error: participantsError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('is_registered', true)
        .eq('role', 'student')

      if (participantsError) throw participantsError

      // 3. Récupérer les soumissions existantes pour ce jour
      const { data: existingSubmissions, error: submissionsError } = await supabaseClient
        .from('submissions')
        .select('user_id')
        .eq('day_number', day.day_number)

      if (submissionsError) throw submissionsError

      const submittedUserIds = new Set(existingSubmissions?.map(s => s.user_id) || [])

      // 4. Trouver les participants qui n'ont pas soumis
      const missedParticipants = participants?.filter(
        p => !submittedUserIds.has(p.id)
      ) || []

      console.log(`❌ ${missedParticipants.length} participants missed the deadline`)

      // 5. Créer des soumissions avec 0 points pour ceux qui ont manqué
      if (missedParticipants.length > 0) {
        const missedSubmissions = missedParticipants.map(participant => ({
          user_id: participant.id,
          day_number: day.day_number,
          platform: 'linkedin', // Valeur par défaut
          post_link: '',
          content_text: null,
          proof_image_url: null,
          status: 'rejected',
          score_awarded: 0,
          missed_deadline: true,
          feedback: 'Deadline manquée - 0 points attribués automatiquement',
          submitted_at: now.toISOString(),
          created_at: now.toISOString()
        }))

        const { error: insertError } = await supabaseClient
          .from('submissions')
          .insert(missedSubmissions)

        if (insertError) throw insertError

        console.log(`✅ Created ${missedSubmissions.length} missed submissions`)
      }

      // 6. Marquer le jour comme expiré
      const { error: updateError } = await supabaseClient
        .from('challenge_days')
        .update({ is_expired: true })
        .eq('day_number', day.day_number)

      if (updateError) throw updateError

      // 7. Activer le jour suivant (si existe)
      const nextDay = day.day_number + 1
      if (nextDay <= 15) {
        const { error: activateError } = await supabaseClient
          .from('challenge_days')
          .update({ is_active: true })
          .eq('day_number', nextDay)

        if (activateError) throw activateError

        console.log(`🚀 Activated Day ${nextDay}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedDays: expiredDays?.length || 0,
        timestamp: now.toISOString()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error processing deadlines:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### **Configuration du Cron Job**

Dans Supabase Dashboard → Edge Functions → Cron Jobs :

```yaml
# Exécuter toutes les heures
- name: process-daily-deadlines
  schedule: "0 * * * *"  # Toutes les heures
  function: process-daily-deadlines
```

Ou pour une exécution plus fréquente :

```yaml
# Exécuter toutes les 15 minutes
- name: process-daily-deadlines
  schedule: "*/15 * * * *"
  function: process-daily-deadlines
```

---

## 🎨 Modifications Frontend

### **1. Composant Countdown Timer**

Créer un nouveau composant pour afficher le compte à rebours :

**Fichier : `src/components/DeadlineCountdown.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface DeadlineCountdownProps {
    deadline: string; // ISO timestamp
    dayNumber: number;
}

const DeadlineCountdown: React.FC<DeadlineCountdownProps> = ({ deadline, dayNumber }) => {
    const [timeLeft, setTimeLeft] = useState<{
        hours: number;
        minutes: number;
        seconds: number;
        isExpired: boolean;
        isUrgent: boolean;
    }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, isUrgent: false });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const deadlineTime = new Date(deadline).getTime();
            const difference = deadlineTime - now;

            if (difference <= 0) {
                return { hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false };
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);
            const isUrgent = hours < 3; // Moins de 3 heures restantes

            return { hours, minutes, seconds, isExpired: false, isUrgent };
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    if (timeLeft.isExpired) {
        return (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold">Deadline expirée</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`border rounded-lg p-3 ${
            timeLeft.isUrgent 
                ? 'bg-orange-500/20 border-orange-500/30' 
                : 'bg-blue-500/20 border-blue-500/30'
        }`}>
            <div className="flex items-center gap-2 mb-2">
                <Clock className={`w-5 h-5 ${timeLeft.isUrgent ? 'text-orange-400' : 'text-blue-400'}`} />
                <span className={`font-bold ${timeLeft.isUrgent ? 'text-orange-400' : 'text-blue-400'}`}>
                    {timeLeft.isUrgent ? '⚠️ Deadline imminente !' : 'Temps restant'}
                </span>
            </div>
            <div className="flex gap-2 text-white font-mono text-lg">
                <div className="flex flex-col items-center bg-black/20 rounded px-3 py-1">
                    <span className="font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-xs text-gray-400">heures</span>
                </div>
                <span className="self-center">:</span>
                <div className="flex flex-col items-center bg-black/20 rounded px-3 py-1">
                    <span className="font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-xs text-gray-400">min</span>
                </div>
                <span className="self-center">:</span>
                <div className="flex flex-col items-center bg-black/20 rounded px-3 py-1">
                    <span className="font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-xs text-gray-400">sec</span>
                </div>
            </div>
        </div>
    );
};

export default DeadlineCountdown;
```

### **2. Mise à Jour du Type ChallengeDay**

**Fichier : `src/types/database.ts`**

```typescript
export interface ChallengeDay {
    day_number: number;
    theme_title: string;
    description: string;
    is_active: boolean;
    start_date?: string; // NOUVEAU
    deadline?: string;   // NOUVEAU
    is_expired?: boolean; // NOUVEAU
    created_at?: string;
}
```

### **3. Intégration dans le Dashboard**

Afficher le countdown dans les cartes de jour actif :

```typescript
// Dans Dashboard.tsx
import DeadlineCountdown from '../components/DeadlineCountdown';

// Dans le rendu des cartes de jour
{status === 'active' && day.deadline && (
    <div className="mt-3">
        <DeadlineCountdown 
            deadline={day.deadline} 
            dayNumber={day.day_number} 
        />
    </div>
)}
```

---

## 📱 Notifications

### **Système de Notifications Push (Optionnel)**

Pour alerter les participants avant la deadline :

```typescript
// Envoyer une notification 3 heures avant la deadline
// Envoyer une notification 1 heure avant la deadline
// Envoyer une notification 15 minutes avant la deadline
```

---

## 🗄️ Script de Migration SQL

**Fichier : `supabase/migrations/add_deadline_system.sql`**

```sql
-- ============================================
-- Migration : Système de Deadline Automatique
-- ============================================

-- 1. Ajouter les colonnes à challenge_days
ALTER TABLE challenge_days
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE;

-- 2. Ajouter la colonne à submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS missed_deadline BOOLEAN DEFAULT FALSE;

-- 3. Créer la table de configuration
CREATE TABLE IF NOT EXISTS challenge_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_start_date TIMESTAMPTZ NOT NULL,
    deadline_hours INTEGER DEFAULT 29,
    auto_progress BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insérer la configuration par défaut
INSERT INTO challenge_config (challenge_start_date, deadline_hours)
VALUES ('2025-01-01 00:00:00+00', 29)
ON CONFLICT DO NOTHING;

-- 5. Fonction pour calculer automatiquement les deadlines
CREATE OR REPLACE FUNCTION calculate_day_deadline(day_num INTEGER, start_date TIMESTAMPTZ, hours INTEGER)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN start_date + ((day_num - 1) * INTERVAL '1 day') + (hours * INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- 6. Initialiser les dates pour les jours existants
DO $$
DECLARE
    config_start_date TIMESTAMPTZ;
    config_deadline_hours INTEGER;
BEGIN
    -- Récupérer la configuration
    SELECT challenge_start_date, deadline_hours 
    INTO config_start_date, config_deadline_hours
    FROM challenge_config 
    LIMIT 1;

    -- Mettre à jour chaque jour
    FOR i IN 1..15 LOOP
        UPDATE challenge_days
        SET 
            start_date = config_start_date + ((i - 1) * INTERVAL '1 day'),
            deadline = calculate_day_deadline(i, config_start_date, config_deadline_hours)
        WHERE day_number = i;
    END LOOP;
END $$;

-- 7. Créer un index pour les requêtes de deadline
CREATE INDEX IF NOT EXISTS idx_challenge_days_deadline 
ON challenge_days(deadline) 
WHERE is_expired = FALSE;

-- 8. Créer un index pour les soumissions manquées
CREATE INDEX IF NOT EXISTS idx_submissions_missed 
ON submissions(missed_deadline, day_number) 
WHERE missed_deadline = TRUE;

COMMENT ON TABLE challenge_config IS 'Configuration globale du challenge avec dates et paramètres de deadline';
COMMENT ON COLUMN challenge_days.start_date IS 'Date et heure de début du jour';
COMMENT ON COLUMN challenge_days.deadline IS 'Date et heure limite de soumission (start_date + deadline_hours)';
COMMENT ON COLUMN challenge_days.is_expired IS 'Indique si la deadline est passée';
COMMENT ON COLUMN submissions.missed_deadline IS 'Indique si la soumission a été créée automatiquement pour deadline manquée';
```

---

## 🧪 Tests

### **1. Test de la Edge Function**

```bash
# Tester localement
supabase functions serve process-daily-deadlines

# Invoquer manuellement
curl -X POST http://localhost:54321/functions/v1/process-daily-deadlines \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### **2. Test du Countdown**

- Créer un jour avec une deadline dans 1 heure
- Vérifier que le countdown s'affiche correctement
- Vérifier que l'alerte "urgent" apparaît < 3h
- Vérifier que "Deadline expirée" apparaît après expiration

### **3. Test de l'Attribution de 0 Points**

1. Créer un jour avec deadline expirée
2. Exécuter la edge function
3. Vérifier que les participants sans soumission reçoivent 0 points
4. Vérifier que `missed_deadline = TRUE`

---

## 📊 Tableau de Bord Admin

Ajouter une section pour surveiller les deadlines :

```typescript
// Afficher les statistiques de deadline
- Participants ayant soumis à temps
- Participants ayant manqué la deadline
- Temps moyen de soumission
- Graphique des soumissions par heure
```

---

## ⚠️ Considérations Importantes

### **1. Fuseau Horaire**
- Utiliser UTC pour toutes les dates
- Afficher en heure locale pour les participants
- Documenter clairement le fuseau horaire de référence

### **2. Gestion des Erreurs**
- Que se passe-t-il si la edge function échoue ?
- Système de retry automatique
- Logs détaillés pour debugging

### **3. Équité**
- Tous les participants doivent avoir exactement 29h
- Pas d'exceptions (sauf cas de force majeure documentés)

### **4. Communication**
- Informer clairement les participants du système
- Afficher les deadlines de manière proéminente
- Envoyer des rappels avant expiration

---

## 🚀 Plan de Déploiement

### **Phase 1 : Préparation (Avant le lancement)**
1. ✅ Exécuter la migration SQL
2. ✅ Déployer la edge function
3. ✅ Configurer le cron job
4. ✅ Tester en environnement de staging

### **Phase 2 : Lancement**
1. ✅ Définir la date de début du challenge
2. ✅ Calculer toutes les deadlines
3. ✅ Activer le système de countdown
4. ✅ Informer les participants

### **Phase 3 : Monitoring**
1. ✅ Surveiller les logs de la edge function
2. ✅ Vérifier les attributions de 0 points
3. ✅ Collecter les feedbacks participants

---

## 📝 Documentation Utilisateur

### **Message pour les Participants**

```
🕐 SYSTÈME DE DEADLINE

Chaque jour du Marathon Challenge, vous disposez de :
- 24 heures pour créer et publier votre contenu
- + 5 heures supplémentaires pour soumettre votre post

Total : 29 heures par jour

⚠️ IMPORTANT :
Si vous ne soumettez pas avant la deadline, vous recevrez 
automatiquement 0 points pour ce jour et le challenge 
passera au jour suivant.

💡 CONSEIL :
Un compte à rebours est affiché sur votre dashboard pour 
vous aider à gérer votre temps !
```

---

## 🔄 Améliorations Futures

1. **Notifications Push** : Alertes avant deadline
2. **Extensions de Deadline** : Pour cas exceptionnels (validés par admin)
3. **Statistiques Avancées** : Analyse des patterns de soumission
4. **Gamification** : Badges pour soumissions rapides
5. **Rappels Personnalisés** : Basés sur les habitudes de l'utilisateur

---

## 📚 Ressources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/functions/schedule-functions)
- [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)
