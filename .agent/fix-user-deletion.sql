-- ============================================
-- Script pour permettre la suppression d'utilisateurs
-- ============================================

-- 1. VÉRIFIER LES CONTRAINTES EXISTANTES
-- Exécutez cette requête pour voir toutes les contraintes de clé étrangère
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'profiles';

-- ============================================
-- 2. SOLUTION : Ajouter CASCADE DELETE
-- ============================================

-- Cette solution supprime automatiquement toutes les données liées
-- quand un profil est supprimé

-- A. Supprimer les anciennes contraintes
ALTER TABLE submissions 
DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;

ALTER TABLE announcements 
DROP CONSTRAINT IF EXISTS announcements_ambassador_id_fkey;

-- B. Recréer les contraintes avec ON DELETE CASCADE
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

-- ============================================
-- 3. FONCTION POUR SUPPRIMER UN UTILISATEUR COMPLET
-- ============================================

-- Cette fonction supprime un utilisateur ET toutes ses données
CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS void AS $$
BEGIN
    -- Supprimer les soumissions
    DELETE FROM submissions WHERE user_id = user_id_to_delete;
    
    -- Supprimer les annonces (si ambassadeur)
    DELETE FROM announcements WHERE ambassador_id = user_id_to_delete;
    
    -- Supprimer le profil
    DELETE FROM profiles WHERE id = user_id_to_delete;
    
    -- Supprimer de auth.users (optionnel, à utiliser avec précaution)
    -- DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RAISE NOTICE 'User % and all related data deleted successfully', user_id_to_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. UTILISATION DE LA FONCTION
-- ============================================

-- Pour supprimer un utilisateur spécifique :
-- SELECT delete_user_completely('USER_ID_HERE');

-- Exemple :
-- SELECT delete_user_completely('123e4567-e89b-12d3-a456-426614174000');

-- ============================================
-- 5. SUPPRIMER PLUSIEURS UTILISATEURS
-- ============================================

-- Pour supprimer tous les utilisateurs de test (exemple)
-- ATTENTION : Utilisez avec précaution !
/*
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id FROM profiles WHERE email LIKE '%test%'
    LOOP
        PERFORM delete_user_completely(user_record.id);
    END LOOP;
END $$;
*/

-- ============================================
-- 6. VÉRIFIER LES POLITIQUES RLS
-- ============================================

-- Voir toutes les politiques sur la table profiles
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Si nécessaire, ajouter une politique pour permettre la suppression
-- (Seulement pour les administrateurs ou le propriétaire)
CREATE POLICY "Users can delete their own profile" ON profiles
FOR DELETE USING (auth.uid() = id);

-- Ou pour les ambassadeurs :
CREATE POLICY "Ambassadors can delete any profile" ON profiles
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'ambassador'
    )
);

-- ============================================
-- 7. DÉSACTIVER TEMPORAIREMENT RLS (POUR TESTS UNIQUEMENT)
-- ============================================

-- ATTENTION : Ne faites ceci que pour tester !
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Après suppression, réactivez :
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. NETTOYER LA BASE DE DONNÉES
-- ============================================

-- Supprimer tous les profils non enregistrés
DELETE FROM profiles WHERE is_registered = false;

-- Supprimer tous les profils sans soumissions (utilisateurs inactifs)
DELETE FROM profiles 
WHERE id NOT IN (SELECT DISTINCT user_id FROM submissions)
AND role = 'student';

-- ============================================
-- 9. VÉRIFICATION FINALE
-- ============================================

-- Compter les utilisateurs restants
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN is_registered THEN 1 END) as registered
FROM profiles
GROUP BY role;

-- Voir les utilisateurs avec leurs données liées
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    COUNT(DISTINCT s.id) as submissions_count,
    COUNT(DISTINCT a.id) as announcements_count
FROM profiles p
LEFT JOIN submissions s ON s.user_id = p.id
LEFT JOIN announcements a ON a.ambassador_id = p.id
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY p.created_at DESC;
