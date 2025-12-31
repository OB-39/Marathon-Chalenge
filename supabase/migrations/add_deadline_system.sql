-- ============================================
-- Migration : Système de Deadline Automatique
-- Date : 2025-12-31
-- Description : Ajoute le système de deadline avec fenêtre de 29h (24h + 5h)
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
    deadline_hours INTEGER DEFAULT 29, -- 24h + 5h
    auto_progress BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insérer la configuration par défaut
-- IMPORTANT : Modifier la date de début selon vos besoins !
INSERT INTO challenge_config (challenge_start_date, deadline_hours)
VALUES ('2025-01-01 00:00:00+00', 29)
ON CONFLICT DO NOTHING;

-- 5. Fonction pour calculer automatiquement les deadlines
CREATE OR REPLACE FUNCTION calculate_day_deadline(day_num INTEGER, start_date TIMESTAMPTZ, hours INTEGER)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    -- Jour 1 commence à start_date
    -- Jour 2 commence à start_date + 1 jour
    -- Deadline = date de début du jour + nombre d'heures configuré
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
            deadline = calculate_day_deadline(i, config_start_date, config_deadline_hours),
            is_expired = FALSE
        WHERE day_number = i;
    END LOOP;
    
    RAISE NOTICE 'Deadlines initialisées pour les 15 jours du challenge';
END $$;

-- 7. Créer un index pour les requêtes de deadline
CREATE INDEX IF NOT EXISTS idx_challenge_days_deadline 
ON challenge_days(deadline) 
WHERE is_expired = FALSE;

-- 8. Créer un index pour les soumissions manquées
CREATE INDEX IF NOT EXISTS idx_submissions_missed 
ON submissions(missed_deadline, day_number) 
WHERE missed_deadline = TRUE;

-- 9. Ajouter des commentaires pour la documentation
COMMENT ON TABLE challenge_config IS 'Configuration globale du challenge avec dates et paramètres de deadline';
COMMENT ON COLUMN challenge_days.start_date IS 'Date et heure de début du jour (UTC)';
COMMENT ON COLUMN challenge_days.deadline IS 'Date et heure limite de soumission (start_date + deadline_hours)';
COMMENT ON COLUMN challenge_days.is_expired IS 'Indique si la deadline est passée et les 0 points attribués';
COMMENT ON COLUMN submissions.missed_deadline IS 'TRUE si la soumission a été créée automatiquement pour deadline manquée (0 points)';

-- 10. Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Créer le trigger pour challenge_config
DROP TRIGGER IF EXISTS update_challenge_config_updated_at ON challenge_config;
CREATE TRIGGER update_challenge_config_updated_at
    BEFORE UPDATE ON challenge_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Vérifications
-- ============================================

-- Vérifier que les colonnes ont été ajoutées
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenge_days' 
        AND column_name = 'deadline'
    ) THEN
        RAISE NOTICE '✅ Colonne deadline ajoutée à challenge_days';
    ELSE
        RAISE EXCEPTION '❌ Échec de l''ajout de la colonne deadline';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'missed_deadline'
    ) THEN
        RAISE NOTICE '✅ Colonne missed_deadline ajoutée à submissions';
    ELSE
        RAISE EXCEPTION '❌ Échec de l''ajout de la colonne missed_deadline';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'challenge_config'
    ) THEN
        RAISE NOTICE '✅ Table challenge_config créée';
    ELSE
        RAISE EXCEPTION '❌ Échec de la création de la table challenge_config';
    END IF;
END $$;

-- Afficher les deadlines configurées
SELECT 
    day_number,
    theme_title,
    start_date AT TIME ZONE 'UTC' as start_date_utc,
    deadline AT TIME ZONE 'UTC' as deadline_utc,
    EXTRACT(EPOCH FROM (deadline - start_date))/3600 as hours_allowed,
    is_expired
FROM challenge_days
ORDER BY day_number;

-- ============================================
-- Notes importantes
-- ============================================

/*
IMPORTANT : 

1. DATE DE DÉBUT
   - Par défaut : 2025-01-01 00:00:00 UTC
   - Modifier dans challenge_config si nécessaire
   - Toutes les deadlines sont calculées à partir de cette date

2. FUSEAU HORAIRE
   - Toutes les dates sont en UTC
   - L'affichage en heure locale se fait côté frontend
   - Ne jamais mélanger les fuseaux horaires

3. EDGE FUNCTION
   - Déployer la edge function process-daily-deadlines
   - Configurer le cron job pour exécution régulière
   - Recommandé : toutes les heures ou toutes les 15 minutes

4. TESTS
   - Tester avec une date de début dans le futur proche
   - Vérifier que les deadlines sont correctement calculées
   - Tester l'attribution automatique de 0 points

5. ROLLBACK
   - Pour annuler cette migration :
   
   DROP TABLE IF EXISTS challenge_config CASCADE;
   ALTER TABLE challenge_days DROP COLUMN IF EXISTS start_date;
   ALTER TABLE challenge_days DROP COLUMN IF EXISTS deadline;
   ALTER TABLE challenge_days DROP COLUMN IF EXISTS is_expired;
   ALTER TABLE submissions DROP COLUMN IF EXISTS missed_deadline;
   DROP FUNCTION IF EXISTS calculate_day_deadline(INTEGER, TIMESTAMPTZ, INTEGER);
   DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
*/
