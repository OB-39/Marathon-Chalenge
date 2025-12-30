-- ============================================
-- VÉRIFICATION : Script SQL exécuté ?
-- ============================================

-- 1. Vérifier si la colonne unique_login_id existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'unique_login_id';

-- Résultat attendu : 
-- Si la colonne existe, vous verrez : unique_login_id | text | YES
-- Si rien n'apparaît, le script n'a PAS été exécuté !


-- 2. Vérifier si la fonction existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'generate_unique_login_id';

-- Résultat attendu :
-- Si la fonction existe : generate_unique_login_id | FUNCTION


-- 3. Vérifier si le trigger existe
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_unique_login_id';

-- Résultat attendu :
-- Si le trigger existe : trigger_set_unique_login_id | INSERT | profiles


-- ============================================
-- SI RIEN N'APPARAÎT, EXÉCUTEZ CECI :
-- ============================================

-- Copiez tout le contenu du fichier .agent/add-unique-login-id.sql
-- et exécutez-le dans Supabase SQL Editor

-- Ou exécutez directement ce script complet :

-- Ajouter la colonne
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unique_login_id TEXT UNIQUE;

-- Créer l'index
CREATE INDEX IF NOT EXISTS idx_profiles_unique_login_id ON profiles(unique_login_id);

-- Créer la fonction de génération
CREATE OR REPLACE FUNCTION generate_unique_login_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        new_id := 'MC-' || 
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-' ||
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM profiles WHERE unique_login_id = new_id) INTO id_exists;
        
        IF NOT id_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Créer la fonction de trigger
CREATE OR REPLACE FUNCTION set_unique_login_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unique_login_id IS NULL AND NEW.is_registered = true THEN
        NEW.unique_login_id := generate_unique_login_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_set_unique_login_id ON profiles;
CREATE TRIGGER trigger_set_unique_login_id
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_unique_login_id();

-- Générer des IDs pour les profils existants
UPDATE profiles 
SET unique_login_id = generate_unique_login_id()
WHERE unique_login_id IS NULL AND is_registered = true;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

-- Voir les profils avec leur ID
SELECT id, full_name, email, unique_login_id, is_registered
FROM profiles
WHERE is_registered = true
ORDER BY created_at DESC
LIMIT 10;
