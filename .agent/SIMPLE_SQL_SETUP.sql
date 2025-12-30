-- ============================================
-- SCRIPT SIMPLE - À COPIER-COLLER DANS SUPABASE
-- ============================================
-- Ce script configure le système d'identifiant unique
-- Copiez TOUT ce fichier et exécutez-le dans Supabase SQL Editor

-- 1. Ajouter la colonne unique_login_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unique_login_id TEXT UNIQUE;

-- 2. Créer un index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_profiles_unique_login_id ON profiles(unique_login_id);

-- 3. Créer la fonction de génération d'ID
CREATE OR REPLACE FUNCTION generate_unique_login_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un ID au format MC-XXXX-XXXX
        new_id := 'MC-' || 
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-' ||
                  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Vérifier si l'ID existe déjà
        SELECT EXISTS(SELECT 1 FROM profiles WHERE unique_login_id = new_id) INTO id_exists;
        
        -- Si l'ID n'existe pas, on sort de la boucle
        IF NOT id_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer la fonction du trigger
CREATE OR REPLACE FUNCTION set_unique_login_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unique_login_id IS NULL AND NEW.is_registered = true THEN
        NEW.unique_login_id := generate_unique_login_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger
DROP TRIGGER IF EXISTS trigger_set_unique_login_id ON profiles;
CREATE TRIGGER trigger_set_unique_login_id
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_unique_login_id();

-- 6. Générer des IDs pour les profils existants
UPDATE profiles 
SET unique_login_id = generate_unique_login_id()
WHERE unique_login_id IS NULL AND is_registered = true;

-- 7. Afficher le résultat
SELECT 
    'Configuration terminée !' as message,
    COUNT(*) as total_profiles,
    COUNT(unique_login_id) as profiles_with_id
FROM profiles;
