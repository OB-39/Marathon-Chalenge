# 📨 Système de Messages Groupés - Guide d'utilisation

## 🎯 Fonctionnalité

Les **ambassadeurs** peuvent maintenant envoyer des messages groupés à plusieurs candidats à la fois via leur messagerie privée.

## ✨ Caractéristiques

### 3 Options de ciblage

1. **📢 Tous les candidats**
   - Envoie le message à tous les participants inscrits
   - Idéal pour : Annonces générales, rappels importants

2. **⏰ En retard (jour actif)**
   - Envoie le message uniquement aux candidats qui n'ont pas encore soumis pour le jour en cours
   - Idéal pour : Rappels de deadline, encouragements

3. **✅ Ayant validé un jour spécifique**
   - Envoie le message aux candidats qui ont validé un jour précis
   - Idéal pour : Félicitations, conseils pour la suite
   - Permet de choisir le jour (1 à 15)

## 🚀 Comment utiliser

### Pour les ambassadeurs

1. **Accéder à la messagerie**
   - Aller dans le Dashboard
   - Cliquer sur l'onglet "Messagerie Privée"

2. **Ouvrir le modal de message groupé**
   - Cliquer sur le bouton **"Message groupé"** (en haut à droite)

3. **Choisir les destinataires**
   - Cliquer sur l'une des 3 options de ciblage
   - Si "Ayant validé un jour" : sélectionner le jour dans la liste déroulante

4. **Rédiger le message**
   - Écrire le message dans la zone de texte
   - Le compteur de caractères s'affiche en bas

5. **Envoyer**
   - Cliquer sur **"Envoyer le message"**
   - Un message de confirmation s'affiche avec le nombre de destinataires
   - Le modal se ferme automatiquement après 2 secondes

### Pour les candidats

- Les messages groupés apparaissent dans leur messagerie privée
- Ils sont identiques aux messages individuels
- Ils peuvent les marquer comme lus

## 💻 Implémentation technique

### Fichiers créés

1. **`src/components/BroadcastMessageModal.tsx`**
   - Modal avec les 3 options de ciblage
   - Gestion de l'envoi des messages
   - Interface utilisateur moderne

2. **`src/components/PrivateMessagesSection.tsx`** (modifié)
   - Ajout du bouton "Message groupé" pour les ambassadeurs
   - Intégration du modal

### Logique de ciblage

#### Option 1 : Tous les candidats
```typescript
const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .eq('is_registered', true);
```

#### Option 2 : En retard (jour actif)
```typescript
// 1. Trouver le jour actif
const { data: activeDay } = await supabase
    .from('challenge_days')
    .select('day_number')
    .eq('is_active', true)
    .single();

// 2. Trouver qui n'a pas soumis
const { data: allStudents } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .eq('is_registered', true);

const { data: submissions } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('day_number', activeDay.day_number);

// 3. Filtrer ceux qui n'ont pas soumis
const submittedIds = new Set(submissions.map(s => s.user_id));
const lateStudents = allStudents.filter(s => !submittedIds.has(s.id));
```

#### Option 3 : Ayant validé un jour
```typescript
const { data } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('day_number', selectedDay)
    .eq('status', 'validated');
```

### Envoi des messages

```typescript
const messages = recipientIds.map(recipientId => ({
    sender_id: user.id,
    receiver_id: recipientId,
    content: message,
    is_read: false,
    created_at: new Date().toISOString()
}));

await supabase
    .from('messages')
    .insert(messages);
```

## 🎨 Interface utilisateur

### Design

- **Modal moderne** avec effet de glassmorphism
- **3 cartes cliquables** pour choisir le ciblage
- **Icônes** : Users, Clock, CheckCircle
- **Couleurs** :
  - Tous : Bleu
  - En retard : Orange
  - Validé : Vert

### Animations

- Apparition du modal : fade + scale + slide
- Sélection d'option : border + glow + ring
- Messages d'erreur/succès : fade + slide

## 📊 Exemples d'utilisation

### Exemple 1 : Rappel général
**Ciblage** : Tous les candidats
**Message** :
```
📢 Rappel important !

N'oubliez pas de soumettre votre publication quotidienne avant la deadline.

Chaque jour compte pour votre progression dans le challenge !

Bonne chance à tous ! 🚀
```

### Exemple 2 : Encouragement pour les retardataires
**Ciblage** : En retard (jour actif)
**Message** :
```
⏰ Il vous reste quelques heures !

Nous avons remarqué que vous n'avez pas encore soumis votre publication pour aujourd'hui.

Ne laissez pas passer cette opportunité ! Même une petite publication vaut mieux que rien.

Vous pouvez le faire ! 💪
```

### Exemple 3 : Félicitations
**Ciblage** : Ayant validé le jour 5
**Message** :
```
🎉 Félicitations !

Bravo pour avoir validé le Jour 5 !

Vous êtes sur la bonne voie. Continuez comme ça et vous atteindrez vos objectifs.

On est fiers de vous ! ✨
```

## ⚠️ Points importants

### Permissions

- **Seuls les ambassadeurs** peuvent envoyer des messages groupés
- Le bouton n'apparaît pas pour les candidats

### Limitations

- Pas de limite de caractères (mais affichage du compteur)
- Pas de pièces jointes (pour l'instant)
- Pas de formatage riche (texte brut uniquement)

### Bonnes pratiques

1. **Soyez concis** : Messages courts et clairs
2. **Utilisez des emojis** : Rend le message plus engageant
3. **Personnalisez** : Adaptez le ton selon le ciblage
4. **Timing** : Envoyez aux moments opportuns (pas trop tôt, pas trop tard)

## 🔧 Dépannage

### Le bouton n'apparaît pas

- Vérifier que vous êtes connecté en tant qu'ambassadeur
- Vérifier que `profile.role === 'ambassador'`

### Aucun destinataire trouvé

- **Tous** : Vérifier qu'il y a des candidats inscrits
- **En retard** : Vérifier qu'il y a un jour actif
- **Validé** : Vérifier qu'il y a des soumissions validées pour ce jour

### Le message ne s'envoie pas

- Vérifier la connexion internet
- Vérifier les permissions Supabase (RLS)
- Consulter la console du navigateur (F12)

## 🎯 Améliorations futures possibles

- [ ] Historique des messages groupés envoyés
- [ ] Templates de messages prédéfinis
- [ ] Programmation d'envoi différé
- [ ] Pièces jointes (images, documents)
- [ ] Formatage riche (gras, italique, listes)
- [ ] Aperçu avant envoi
- [ ] Statistiques de lecture
- [ ] Réponses groupées

## ✅ Checklist de déploiement

- [x] Composant `BroadcastMessageModal.tsx` créé
- [x] Composant `PrivateMessagesSection.tsx` modifié
- [ ] Tests effectués (tous les candidats)
- [ ] Tests effectués (en retard)
- [ ] Tests effectués (ayant validé)
- [ ] Vérification des permissions
- [ ] Documentation mise à jour
- [ ] Ambassadeurs formés à l'utilisation
