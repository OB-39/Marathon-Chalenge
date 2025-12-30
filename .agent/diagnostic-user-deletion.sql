-- ============================================
-- DIAGNOSTIC RAPIDE - Problèmes de suppression
-- ============================================
-- Exécutez ces requêtes une par une pour diagnostiquer

-- 1. VÉRIFIER LES CONTRAINTES DE CLÉ ÉTRANGÈRE
-- ============================================
SELECT
    tc.table_name AS "Table", 
    kcu.column_name AS "Colonne", 
    ccu.table_name AS "Table référencée",
    ccu.column_name AS "Colonne référencée",
    tc.constraint_name AS "Nom contrainte"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'profiles'
ORDER BY tc.table_name;

-- Résultat attendu : Vous verrez les tables qui référencent 'profiles'
-- Exemple : submissions.user_id → profiles.id


-- 2. COMPTER LES DONNÉES LIÉES PAR UTILISATEUR
-- ============================================
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    COUNT(DISTINCT s.id) as "Nombre soumissions",
    COUNT(DISTINCT a.id) as "Nombre annonces"
FROM profiles p
LEFT JOIN submissions s ON s.user_id = p.id
LEFT JOIN announcements a ON a.ambassador_id = p.id
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY "Nombre soumissions" DESC, "Nombre annonces" DESC;

-- Résultat : Vous verrez combien de données chaque utilisateur a


-- 3. VÉRIFIER LES POLITIQUES RLS
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'submissions', 'announcements')
ORDER BY tablename, policyname;

-- Résultat : Vous verrez toutes les politiques de sécurité


-- 4. VÉRIFIER SI RLS EST ACTIVÉ
-- ============================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'submissions', 'announcements');

-- Résultat : rowsecurity = true signifie que RLS est activé


-- 5. TROUVER LES UTILISATEURS SANS DONNÉES
-- ============================================
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.created_at
FROM profiles p
LEFT JOIN submissions s ON s.user_id = p.id
LEFT JOIN announcements a ON a.ambassador_id = p.id
WHERE s.id IS NULL AND a.id IS NULL
ORDER BY p.created_at DESC;

-- Résultat : Utilisateurs qui peuvent être supprimés sans problème


-- 6. STATISTIQUES GLOBALES
-- ============================================
SELECT 
    'Total profiles' as "Métrique",
    COUNT(*)::text as "Valeur"
FROM profiles
UNION ALL
SELECT 
    'Profiles enregistrés',
    COUNT(*)::text
FROM profiles WHERE is_registered = true
UNION ALL
SELECT 
    'Étudiants',
    COUNT(*)::text
FROM profiles WHERE role = 'student'
UNION ALL
SELECT 
    'Ambassadeurs',
    COUNT(*)::text
FROM profiles WHERE role = 'ambassador'
UNION ALL
SELECT 
    'Total soumissions',
    COUNT(*)::text
FROM submissions
UNION ALL
SELECT 
    'Total annonces',
    COUNT(*)::text
FROM announcements;


-- 7. VÉRIFIER LES TRIGGERS
-- ============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('profiles', 'submissions', 'announcements')
ORDER BY event_object_table, trigger_name;

-- Résultat : Vous verrez tous les triggers actifs


-- ============================================
-- RÉSUMÉ DU DIAGNOSTIC
-- ============================================
-- Après avoir exécuté ces requêtes, vous saurez :
-- 
-- ✅ Quelles tables empêchent la suppression (requête 1)
-- ✅ Combien de données chaque utilisateur a (requête 2)
-- ✅ Quelles politiques RLS sont actives (requête 3)
-- ✅ Si RLS est activé (requête 4)
-- ✅ Quels utilisateurs peuvent être supprimés facilement (requête 5)
-- ✅ Les statistiques globales (requête 6)
-- ✅ Quels triggers sont actifs (requête 7)
--
-- Avec ces informations, vous pouvez choisir la meilleure solution !
