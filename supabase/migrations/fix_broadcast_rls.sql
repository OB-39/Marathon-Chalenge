-- Fix RLS Policies pour broadcast_recipients
-- Date: 2026-01-03

-- 1. Désactiver temporairement RLS pour tester
ALTER TABLE broadcast_recipients DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own broadcast messages" ON broadcast_recipients;
DROP POLICY IF EXISTS "Users can update their own broadcast read status" ON broadcast_recipients;
DROP POLICY IF EXISTS "Ambassadors can insert broadcast recipients" ON broadcast_recipients;
DROP POLICY IF EXISTS "Ambassadors can view all broadcast recipients" ON broadcast_recipients;

-- 3. Réactiver RLS
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- 4. Créer une policy simple pour SELECT
CREATE POLICY "Users can view their own messages"
    ON broadcast_recipients FOR SELECT
    TO authenticated
    USING (recipient_id = auth.uid());

-- 5. Policy pour UPDATE (marquer comme lu)
CREATE POLICY "Users can update their own messages"
    ON broadcast_recipients FOR UPDATE
    TO authenticated
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- 6. Policy pour INSERT (ambassadeurs)
CREATE POLICY "Ambassadors can create recipients"
    ON broadcast_recipients FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'ambassador'
        )
    );

-- 7. Vérifier les policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'broadcast_recipients'
ORDER BY policyname;
