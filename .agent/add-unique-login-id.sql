-- Ajouter le champ unique_login_id à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unique_login_id TEXT UNIQUE;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_profiles_unique_login_id ON profiles(unique_login_id);

-- Fonction pour générer un identifiant unique (format: MC-XXXX-XXXX)
CREATE OR REPLACE FUNCTION generate_unique_login_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un ID au format MC-XXXX-XXXX (MC = Marathon Challenge)
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

-- Générer des IDs uniques pour les profils existants qui n'en ont pas
UPDATE profiles 
SET unique_login_id = generate_unique_login_id()
WHERE unique_login_id IS NULL AND is_registered = true;

-- Trigger pour générer automatiquement un ID lors de l'inscription
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

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.unique_login_id IS 'Identifiant unique de connexion au format MC-XXXX-XXXX';
