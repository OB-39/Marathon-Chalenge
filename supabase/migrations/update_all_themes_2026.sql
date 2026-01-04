-- ============================================
-- Mise à jour des thèmes du Marathon Challenge
-- Date : 2026-01-02
-- ============================================

-- Jour 1 : Présentation
UPDATE challenge_days
SET 
    theme_title = 'Présentation',
    description = 'Présentation (Soit de toi-même, soit du Challenge) et pourquoi vous avez choisi le Challenge'
WHERE day_number = 1;

-- Jour 2 : Le Premier Obstacle
UPDATE challenge_days
SET 
    theme_title = 'Le Premier Obstacle',
    description = 'Quelle est la peur qui vous empêchait de publier jusqu''ici ? En parler, c''est déjà la désamorcer.'
WHERE day_number = 2;

-- Jour 3 : Un conseil
UPDATE challenge_days
SET 
    theme_title = 'Un conseil',
    description = 'Le meilleur conseil que j''ai reçu... et comment je l''applique ?'
WHERE day_number = 3;

-- Jour 4 : Mon erreur formatrice
UPDATE challenge_days
SET 
    theme_title = 'Mon erreur formatrice',
    description = 'Une erreur qui m''a fait grandir'
WHERE day_number = 4;

-- Jour 5 : Action
UPDATE challenge_days
SET 
    theme_title = 'Action',
    description = 'Ce que j''ai mis en place aujourd''hui pour progresser'
WHERE day_number = 5;

-- Jour 6 : La question qui révèle
UPDATE challenge_days
SET 
    theme_title = 'La question qui révèle',
    description = 'Je me pose cette question aujourd''hui : (question ouverte)'
WHERE day_number = 6;

-- Jour 7 : Bilan
UPDATE challenge_days
SET 
    theme_title = 'Bilan',
    description = 'Ce que ces 6 premiers jours m''ont déjà appris'
WHERE day_number = 7;

-- Jour 8 : Réseaux sociaux
UPDATE challenge_days
SET 
    theme_title = 'Réseaux sociaux',
    description = 'Ce que j''ai compris sur la visibilité en ligne'
WHERE day_number = 8;

-- Jour 9 : PAS DE THÈME SPÉCIFIÉ - On garde l'ancien ou on met un thème générique
-- (Vous n'avez pas fourni de thème pour le jour 9)

-- Jour 10 : L'Anecdote Marquante
UPDATE challenge_days
SET 
    theme_title = 'L''Anecdote Marquante',
    description = 'Racontez une rencontre ou un événement court qui a changé votre journée. Utilisez le storytelling : un début, une émotion, une conclusion.'
WHERE day_number = 10;

-- Jour 11 : PAS DE THÈME SPÉCIFIÉ - On garde l'ancien ou on met un thème générique
-- (Vous n'avez pas fourni de thème pour le jour 11)

-- Jour 12 : La Discipline vs La Motivation
UPDATE challenge_days
SET 
    theme_title = 'La Discipline vs La Motivation',
    description = 'Racontez comment vous avez réussi à faire quelque chose un jour où vous n''aviez aucune envie de la faire.'
WHERE day_number = 12;

-- Jour 13 : Mon univers inspirant
UPDATE challenge_days
SET 
    theme_title = 'Mon univers inspirant',
    description = 'Au plus 3 sources d''inspiration qui vous influencent (ou outils que vous utilisez au quotidien). Objectif : Se positionner par rapport à des références. Action : Présenter des livres, créateurs ou expériences formatrices, Outils ou astuces (Que ce soit éducatifs ou professionnels), votre mentor, ... Pourquoi ça marche : Donne du contexte personnel, facilite les connexions'
WHERE day_number = 13;

-- Jour 14 : Le Mythe Déboulonné
UPDATE challenge_days
SET 
    theme_title = 'Le Mythe Déboulonné',
    description = 'Quelle idée reçue dans votre domaine (ou dans la vie) vous agace ? Donnez votre point de vue contraire.'
WHERE day_number = 14;

-- Jour 15 : Conclusion
UPDATE challenge_days
SET 
    theme_title = 'Conclusion',
    description = 'Ce que ce challenge m''a apporté et la suite'
WHERE day_number = 15;

-- ============================================
-- Vérification des mises à jour
-- ============================================

SELECT 
    day_number,
    theme_title,
    LEFT(description, 100) as description_preview
FROM challenge_days
WHERE day_number <= 15
ORDER BY day_number;

-- ============================================
-- Résumé
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Thèmes mis à jour avec succès !';
    RAISE NOTICE '';
    RAISE NOTICE 'Jours mis à jour :';
    RAISE NOTICE '  Jour 1  : Présentation';
    RAISE NOTICE '  Jour 2  : Le Premier Obstacle';
    RAISE NOTICE '  Jour 3  : Un conseil';
    RAISE NOTICE '  Jour 4  : Mon erreur formatrice';
    RAISE NOTICE '  Jour 5  : Action';
    RAISE NOTICE '  Jour 6  : La question qui révèle';
    RAISE NOTICE '  Jour 7  : Bilan';
    RAISE NOTICE '  Jour 8  : Réseaux sociaux';
    RAISE NOTICE '  Jour 9  : (non spécifié - ancien thème conservé)';
    RAISE NOTICE '  Jour 10 : L''Anecdote Marquante';
    RAISE NOTICE '  Jour 11 : (non spécifié - ancien thème conservé)';
    RAISE NOTICE '  Jour 12 : La Discipline vs La Motivation';
    RAISE NOTICE '  Jour 13 : Mon univers inspirant';
    RAISE NOTICE '  Jour 14 : Le Mythe Déboulonné';
    RAISE NOTICE '  Jour 15 : Conclusion';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ NOTE : Les jours 9 et 11 n''ont pas été fournis dans votre liste.';
    RAISE NOTICE '   Leurs thèmes actuels ont été conservés.';
END $$;
