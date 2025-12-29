-- Supprimer l'ancienne contrainte restrictive
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_preferred_platform_check;

-- Ajouter une nouvelle contrainte plus flexible qui accepte plusieurs plateformes
-- La contrainte vérifie que la chaîne contient uniquement des noms de plateformes valides
ALTER TABLE profiles ADD CONSTRAINT profiles_preferred_platform_check 
CHECK (
    preferred_platform IS NULL OR
    preferred_platform ~ '^(Instagram|TikTok|LinkedIn|Twitter|YouTube|Facebook)(,\s*(Instagram|TikTok|LinkedIn|Twitter|YouTube|Facebook))*$'
);

-- Ou si vous préférez une approche plus simple sans contrainte stricte :
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_preferred_platform_check;
