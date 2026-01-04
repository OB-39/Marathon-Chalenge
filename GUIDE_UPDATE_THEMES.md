# 🔄 Mise à jour des thèmes du Challenge

## 📋 Thèmes à mettre à jour

Voici les **13 thèmes** que vous avez fournis (sur 15 jours) :

1. ✅ **Jour 1** : Présentation
2. ✅ **Jour 2** : Le Premier Obstacle
3. ✅ **Jour 3** : Un conseil
4. ✅ **Jour 4** : Mon erreur formatrice
5. ✅ **Jour 5** : Action
6. ✅ **Jour 6** : La question qui révèle
7. ✅ **Jour 7** : Bilan
8. ✅ **Jour 8** : Réseaux sociaux
9. ⚠️ **Jour 9** : (non fourni - ancien thème conservé)
10. ✅ **Jour 10** : L'Anecdote Marquante
11. ⚠️ **Jour 11** : (non fourni - ancien thème conservé)
12. ✅ **Jour 12** : La Discipline vs La Motivation
13. ✅ **Jour 13** : Mon univers inspirant
14. ✅ **Jour 14** : Le Mythe Déboulonné
15. ✅ **Jour 15** : Conclusion

## 🚀 Comment exécuter la mise à jour

### Étape 1 : Ouvrir Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor** (menu de gauche)

### Étape 2 : Exécuter le script

1. Copier tout le contenu du fichier `supabase/migrations/update_all_themes_2026.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur **Run** ▶️

### Étape 3 : Vérifier les résultats

Le script affichera :
- ✅ Un message de confirmation
- 📋 La liste des jours mis à jour
- ⚠️ Une note sur les jours 9 et 11

## 📊 Résultat attendu

Après l'exécution, vous verrez un tableau avec :
- `day_number` : Le numéro du jour
- `theme_title` : Le nouveau titre du thème
- `description_preview` : Les 100 premiers caractères de la description

## ⚠️ Important

### Jours 9 et 11

Vous n'avez pas fourni de thèmes pour ces jours. Deux options :

**Option 1 : Les laisser tels quels**
- Ils garderont leurs anciens thèmes
- Aucune action requise

**Option 2 : Les définir maintenant**
Si vous voulez définir les thèmes pour les jours 9 et 11, dites-moi quels thèmes vous voulez et je mettrai à jour le script.

## 🔍 Vérification manuelle

Pour vérifier que les thèmes ont bien été mis à jour, exécutez cette requête :

```sql
SELECT 
    day_number,
    theme_title,
    description
FROM challenge_days
WHERE day_number <= 15
ORDER BY day_number;
```

## 📝 Détails des thèmes

### Jour 1 : Présentation
> Présentation (Soit de toi-même, soit du Challenge) et pourquoi vous avez choisi le Challenge

### Jour 2 : Le Premier Obstacle
> Quelle est la peur qui vous empêchait de publier jusqu'ici ? En parler, c'est déjà la désamorcer.

### Jour 3 : Un conseil
> Le meilleur conseil que j'ai reçu... et comment je l'applique ?

### Jour 4 : Mon erreur formatrice
> Une erreur qui m'a fait grandir

### Jour 5 : Action
> Ce que j'ai mis en place aujourd'hui pour progresser

### Jour 6 : La question qui révèle
> Je me pose cette question aujourd'hui : (question ouverte)

### Jour 7 : Bilan
> Ce que ces 6 premiers jours m'ont déjà appris

### Jour 8 : Réseaux sociaux
> Ce que j'ai compris sur la visibilité en ligne

### Jour 10 : L'Anecdote Marquante
> Racontez une rencontre ou un événement court qui a changé votre journée. Utilisez le storytelling : un début, une émotion, une conclusion.

### Jour 12 : La Discipline vs La Motivation
> Racontez comment vous avez réussi à faire quelque chose un jour où vous n'aviez aucune envie de la faire.

### Jour 13 : Mon univers inspirant
> Au plus 3 sources d'inspiration qui vous influencent (ou outils que vous utilisez au quotidien). Objectif : Se positionner par rapport à des références. Action : Présenter des livres, créateurs ou expériences formatrices, Outils ou astuces (Que ce soit éducatifs ou professionnels), votre mentor, ... Pourquoi ça marche : Donne du contexte personnel, facilite les connexions

### Jour 14 : Le Mythe Déboulonné
> Quelle idée reçue dans votre domaine (ou dans la vie) vous agace ? Donnez votre point de vue contraire.

### Jour 15 : Conclusion
> Ce que ce challenge m'a apporté et la suite

---

## ✅ Checklist

- [ ] Script SQL copié
- [ ] Supabase Dashboard ouvert
- [ ] SQL Editor ouvert
- [ ] Script collé
- [ ] Script exécuté
- [ ] Résultats vérifiés
- [ ] Thèmes des jours 9 et 11 définis (optionnel)

---

**Voulez-vous que je définisse aussi les thèmes pour les jours 9 et 11 ?**
