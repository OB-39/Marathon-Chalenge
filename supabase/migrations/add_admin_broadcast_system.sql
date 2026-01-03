-- Migration: Système de messagerie admin
-- Date: 2026-01-03

-- Table pour les messages groupés des admins
CREATE TABLE IF NOT EXISTS admin_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'no_submission_today', 'custom')),
    target_day INTEGER, -- Pour les messages ciblant un jour spécifique
    recipient_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour tracker qui a reçu quel message
CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broadcast_id UUID NOT NULL REFERENCES admin_broadcasts(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(broadcast_id, recipient_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_sender ON admin_broadcasts(sender_id);
CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_sent_at ON admin_broadcasts(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_recipient ON broadcast_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_unread ON broadcast_recipients(recipient_id, is_read) WHERE is_read = FALSE;

-- Fonction pour obtenir les participants sans soumission pour un jour donné
CREATE OR REPLACE FUNCTION get_participants_without_submission(target_day_number INTEGER)
RETURNS TABLE (user_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id
    FROM profiles p
    WHERE p.role = 'student'
      AND p.is_registered = TRUE
      AND NOT EXISTS (
          SELECT 1
          FROM submissions s
          WHERE s.user_id = p.id
            AND s.day_number = target_day_number
      );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un message comme lu
CREATE OR REPLACE FUNCTION mark_broadcast_as_read(
    p_broadcast_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE broadcast_recipients
    SET is_read = TRUE,
        read_at = NOW()
    WHERE broadcast_id = p_broadcast_id
      AND recipient_id = p_user_id
      AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE admin_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- Policies pour admin_broadcasts
DROP POLICY IF EXISTS "Ambassadors can create broadcasts" ON admin_broadcasts;
CREATE POLICY "Ambassadors can create broadcasts"
    ON admin_broadcasts FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'ambassador'
        )
    );

DROP POLICY IF EXISTS "Ambassadors can view all broadcasts" ON admin_broadcasts;
CREATE POLICY "Ambassadors can view all broadcasts"
    ON admin_broadcasts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'ambassador'
        )
    );

-- Policies pour broadcast_recipients
DROP POLICY IF EXISTS "Users can view their own broadcast messages" ON broadcast_recipients;
CREATE POLICY "Users can view their own broadcast messages"
    ON broadcast_recipients FOR SELECT
    TO authenticated
    USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own broadcast read status" ON broadcast_recipients;
CREATE POLICY "Users can update their own broadcast read status"
    ON broadcast_recipients FOR UPDATE
    TO authenticated
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Ambassadors can insert broadcast recipients" ON broadcast_recipients;
CREATE POLICY "Ambassadors can insert broadcast recipients"
    ON broadcast_recipients FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'ambassador'
        )
    );

DROP POLICY IF EXISTS "Ambassadors can view all broadcast recipients" ON broadcast_recipients;
CREATE POLICY "Ambassadors can view all broadcast recipients"
    ON broadcast_recipients FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'ambassador'
        )
    );

-- Commentaires
COMMENT ON TABLE admin_broadcasts IS 'Messages groupés envoyés par les ambassadeurs';
COMMENT ON TABLE broadcast_recipients IS 'Destinataires des messages groupés';
COMMENT ON COLUMN admin_broadcasts.target_type IS 'Type de cible: all (tous), no_submission_today (sans soumission), custom (personnalisé)';
COMMENT ON COLUMN admin_broadcasts.target_day IS 'Numéro du jour pour les messages ciblés';
COMMENT ON FUNCTION get_participants_without_submission IS 'Retourne les IDs des participants sans soumission pour un jour donné';
