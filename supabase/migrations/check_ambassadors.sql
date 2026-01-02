-- ============================================
-- Vérification : Comptes ambassadeurs
-- ============================================

-- 1. Lister tous les ambassadeurs
SELECT 
    id,
    email,
    full_name,
    role,
    is_registered,
    created_at
FROM profiles
WHERE role = 'ambassador'
ORDER BY created_at DESC;

-- 2. Compter les ambassadeurs
SELECT 
    COUNT(*) as nombre_ambassadeurs
FROM profiles
WHERE role = 'ambassador';

-- 3. Si aucun ambassadeur n'existe, en créer un (DÉCOMMENTER SI NÉCESSAIRE)
/*
-- Remplacer 'VOTRE_EMAIL@example.com' par votre email
UPDATE profiles
SET role = 'ambassador'
WHERE email = 'VOTRE_EMAIL@example.com';
*/

-- 4. Vérifier votre propre rôle (remplacer par votre email)
/*
SELECT 
    id,
    email,
    full_name,
    role,
    is_registered
FROM profiles
WHERE email = 'VOTRE_EMAIL@example.com';
*/

-- 5. Lister tous les profils avec leur rôle
SELECT 
    role,
    COUNT(*) as nombre
FROM profiles
GROUP BY role
ORDER BY role;
