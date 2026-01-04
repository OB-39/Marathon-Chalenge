# 📊 Mise à Jour du Système de Notation - Marathon Challenge

## Date de mise à jour
3 janvier 2026

## Résumé des changements

Le système de notation a été mis à jour pour différencier les premiers jours (phase d'introduction) des jours suivants (phase d'approfondissement).

## Nouveau Système de Notation

### Jours 1-3 : Phase d'Introduction (10 points)
**Total : 10 points par jour**

Critères d'évaluation :
- **Pertinence** au thème du jour : 0-3 points
- **Qualité** du contenu : 0-3 points
- **Engagement** créé : 0-2 points
- **Originalité** : 0-2 points

### Jours 4-15 : Phase d'Approfondissement (20 points)
**Total : 20 points par jour**

Critères d'évaluation :
- **Pertinence** au thème du jour : 0-6 points
- **Qualité** du contenu : 0-6 points
- **Engagement** créé : 0-4 points
- **Originalité** : 0-4 points

## Justification

Cette évolution du système de notation reflète la progression naturelle du challenge :

1. **Jours 1-3** : Les participants découvrent le challenge, apprennent à publier régulièrement et surmontent leurs premières peurs. La notation sur 10 points permet une évaluation bienveillante pendant cette phase d'adaptation.

2. **Jours 4-15** : Les participants ont pris leurs marques et sont prêts à approfondir leur pratique. La notation sur 20 points permet :
   - Une évaluation plus nuancée de la qualité
   - Une meilleure différenciation entre les participants
   - Une récompense plus importante pour l'excellence

## Score Maximum Possible

- **Ancien système** : 150 points (15 jours × 10 points)
- **Nouveau système** : 270 points (3 jours × 10 points + 12 jours × 20 points)

## Fichiers Modifiés

### 1. `THEMES_CHALLENGE.md`
- Mise à jour de la section "Critères d'évaluation"
- Ajout de la distinction entre les deux phases

### 2. `src/pages/AdminDashboard.tsx`
- Ajout de la fonction `getMaxScoreForDay(dayNumber)` qui retourne :
  - `10` pour les jours 1-3
  - `20` pour les jours 4-15
- Mise à jour du modal d'évaluation pour afficher dynamiquement le score maximum
- Mise à jour de l'affichage des scores dans les listes (desktop et mobile)

## Impact sur les Participants

### Pour les nouveaux participants
- Aucun impact : ils bénéficient du nouveau système dès le début

### Pour les participants en cours
- Les jours déjà validés conservent leur score
- À partir du jour 4, ils seront notés sur 20 points
- Cela leur donne l'opportunité de rattraper leur retard ou de creuser l'écart

## Recommandations pour les Ambassadeurs

1. **Communication** : Informez les participants de ce changement via un message groupé
2. **Transparence** : Expliquez clairement les nouveaux critères dès le jour 4
3. **Bienveillance** : Continuez à encourager les participants, surtout pendant la transition
4. **Cohérence** : Assurez-vous d'appliquer les mêmes critères pour tous les participants d'un même jour

## Notes Techniques

- Le système détecte automatiquement le jour de la soumission
- L'interface d'évaluation s'adapte dynamiquement
- Aucune migration de données n'est nécessaire
- Les scores existants restent inchangés

---

*Document créé le 3 janvier 2026*
