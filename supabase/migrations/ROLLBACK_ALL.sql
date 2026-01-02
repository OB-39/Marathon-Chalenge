-- ============================================
-- ROLLBACK : Annuler toutes les modifications d'aujourd'hui
-- Date : 2026-01-02
-- ============================================
-- Ce script annule TOUTES les modifications faites aujourd'hui :
-- 1. Supprime les soumissions automatiques avec 0 points (si créées)
-- 2. Supprime la colonne is_late_submission (si ajoutée)
-- 3. Supprime les triggers et fonctions (si créés)
-- 4. Remet les jours à l'état d'avant
-- ============================================

-- ============================================
-- ÉTAPE 1 : Supprimer les soumissions automatiques avec 0 points
-- ============================================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE '🧹 ÉTAPE 1/5 : Suppression des soumissions automatiques...';
    
    -- Compter les soumissions à supprimer
    SELECT COUNT(*) INTO deleted_count
    FROM submissions
    WHERE missed_deadline = true
      AND score_awarded = 0
      AND status = 'rejected'
      AND (post_link = '' OR post_link IS NULL);
    
    RAISE NOTICE '📊 Soumissions automatiques trouvées : %', deleted_count;
    
    -- Supprimer les soumissions automatiques avec 0 points
    DELETE FROM submissions
    WHERE missed_deadline = true
      AND score_awarded = 0
      AND status = 'rejected'
      AND (post_link = '' OR post_link IS NULL);
    
    RAISE NOTICE '✅ % soumission(s) supprimée(s)', deleted_count;
END $$;

-- ============================================
-- ÉTAPE 2 : Supprimer la vue submissions_with_penalty (si existe)
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '🗑️ ÉTAPE 2/5 : Suppression de la vue submissions_with_penalty...';
    
    DROP VIEW IF EXISTS submissions_with_penalty CASCADE;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'submissions_with_penalty'
    ) THEN
        RAISE NOTICE '✅ Vue submissions_with_penalty supprimée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 3 : Supprimer le trigger et la fonction (si existent)
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '🗑️ ÉTAPE 3/5 : Suppression du trigger et des fonctions...';
    
    -- Supprimer le trigger
    DROP TRIGGER IF EXISTS trigger_mark_late_submission ON submissions;
    RAISE NOTICE '✅ Trigger trigger_mark_late_submission supprimé';
    
    -- Supprimer les fonctions
    DROP FUNCTION IF EXISTS mark_late_submission() CASCADE;
    RAISE NOTICE '✅ Fonction mark_late_submission supprimée';
    
    DROP FUNCTION IF EXISTS calculate_score_with_penalty(INTEGER, BOOLEAN) CASCADE;
    RAISE NOTICE '✅ Fonction calculate_score_with_penalty supprimée';
END $$;

-- ============================================
-- ÉTAPE 4 : Supprimer la colonne is_late_submission (si existe)
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '🗑️ ÉTAPE 4/5 : Suppression de la colonne is_late_submission...';
    
    -- Supprimer l'index d'abord
    DROP INDEX IF EXISTS idx_submissions_late;
    RAISE NOTICE '✅ Index idx_submissions_late supprimé';
    
    -- Supprimer la colonne
    ALTER TABLE submissions DROP COLUMN IF EXISTS is_late_submission;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'is_late_submission'
    ) THEN
        RAISE NOTICE '✅ Colonne is_late_submission supprimée';
    END IF;
END $$;

-- ============================================
-- ÉTAPE 5 : Optionnel - Réinitialiser l'état des jours
-- ============================================
-- ATTENTION : Décommentez seulement si vous voulez vraiment réinitialiser les jours

/*
DO $$
BEGIN
    RAISE NOTICE '🔄 ÉTAPE 5/5 : Réinitialisation de l''état des jours...';
    
    -- Démarquer tous les jours comme expirés
    UPDATE challenge_days 
    SET is_expired = false;
    
    -- Réactiver seulement le jour 1
    UPDATE challenge_days 
    SET is_active = false;
    
    UPDATE challenge_days 
    SET is_active = true 
    WHERE day_number = 1;
    
    RAISE NOTICE '✅ Jours réinitialisés : Jour 1 actif, autres inactifs';
END $$;
*/

-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

DO $$
DECLARE
    remaining_auto_submissions INTEGER;
    has_late_column BOOLEAN;
    has_trigger BOOLEAN;
    has_function BOOLEAN;
    has_view BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '🔍 VÉRIFICATIONS FINALES';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier les soumissions automatiques restantes
    SELECT COUNT(*) INTO remaining_auto_submissions
    FROM submissions
    WHERE missed_deadline = true
      AND score_awarded = 0
      AND status = 'rejected';
    
    IF remaining_auto_submissions = 0 THEN
        RAISE NOTICE '✅ Aucune soumission automatique restante';
    ELSE
        RAISE NOTICE '⚠️ % soumission(s) automatique(s) restante(s)', remaining_auto_submissions;
    END IF;
    
    -- Vérifier la colonne
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'is_late_submission'
    ) INTO has_late_column;
    
    IF NOT has_late_column THEN
        RAISE NOTICE '✅ Colonne is_late_submission : Supprimée';
    ELSE
        RAISE NOTICE '⚠️ Colonne is_late_submission : Existe encore';
    END IF;
    
    -- Vérifier le trigger
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_mark_late_submission'
    ) INTO has_trigger;
    
    IF NOT has_trigger THEN
        RAISE NOTICE '✅ Trigger : Supprimé';
    ELSE
        RAISE NOTICE '⚠️ Trigger : Existe encore';
    END IF;
    
    -- Vérifier la fonction
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'calculate_score_with_penalty'
    ) INTO has_function;
    
    IF NOT has_function THEN
        RAISE NOTICE '✅ Fonction : Supprimée';
    ELSE
        RAISE NOTICE '⚠️ Fonction : Existe encore';
    END IF;
    
    -- Vérifier la vue
    SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'submissions_with_penalty'
    ) INTO has_view;
    
    IF NOT has_view THEN
        RAISE NOTICE '✅ Vue : Supprimée';
    ELSE
        RAISE NOTICE '⚠️ Vue : Existe encore';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '🎉 ROLLBACK TERMINÉ !';
    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- ============================================
-- AFFICHER L'ÉTAT ACTUEL
-- ============================================

-- État des jours
SELECT 
    day_number,
    theme_title,
    is_active,
    is_expired,
    TO_CHAR(deadline, 'DD/MM/YYYY HH24:MI') as deadline
FROM challenge_days
WHERE day_number <= 5
ORDER BY day_number;

-- Statistiques des soumissions
SELECT 
    day_number,
    COUNT(*) as total_soumissions,
    COUNT(*) FILTER (WHERE status = 'validated') as validees,
    COUNT(*) FILTER (WHERE status = 'pending') as en_attente,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejetees
FROM submissions
GROUP BY day_number
ORDER BY day_number;
