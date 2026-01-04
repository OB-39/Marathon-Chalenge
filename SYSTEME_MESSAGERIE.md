# 📬 Système de Messagerie Admin-Participants

## Date de création : 3 janvier 2026

---

## 🎯 Vue d'Ensemble

Système de communication permettant aux ambassadeurs d'envoyer des messages groupés aux participants avec ciblage intelligent.

---

## 📊 Architecture

### Tables Supabase

#### 1. `admin_broadcasts`
Messages groupés envoyés par les ambassadeurs.

**Colonnes :**
- `id` (UUID) - Identifiant unique
- `sender_id` (UUID) - ID de l'ambassadeur
- `title` (TEXT) - Titre du message
- `message` (TEXT) - Contenu du message
- `target_type` (TEXT) - Type de ciblage
  - `'all'` : Tous les participants
  - `'no_submission_today'` : Sans soumission pour un jour
  - `'custom'` : Ciblage personnalisé
- `target_day` (INTEGER) - Jour concerné (si applicable)
- `recipient_count` (INTEGER) - Nombre de destinataires
- `sent_at` (TIMESTAMPTZ) - Date d'envoi
- `created_at` (TIMESTAMPTZ) - Date de création

#### 2. `broadcast_recipients`
Destinataires des messages groupés.

**Colonnes :**
- `id` (UUID) - Identifiant unique
- `broadcast_id` (UUID) - ID du broadcast
- `recipient_id` (UUID) - ID du participant
- `is_read` (BOOLEAN) - Message lu ou non
- `read_at` (TIMESTAMPTZ) - Date de lecture
- `created_at` (TIMESTAMPTZ) - Date de création

**Contrainte :**
- UNIQUE(broadcast_id, recipient_id) - Un participant ne peut recevoir qu'une fois le même broadcast

---

## 🔧 Fonctions SQL

### `get_participants_without_submission(target_day_number)`
Retourne les participants sans soumission pour un jour donné.

```sql
SELECT * FROM get_participants_without_submission(5);
-- Retourne les IDs des participants sans soumission pour le jour 5
```

### `mark_broadcast_as_read(p_broadcast_id, p_user_id)`
Marque un message comme lu pour un utilisateur.

```sql
SELECT mark_broadcast_as_read('broadcast-uuid', 'user-uuid');
```

---

## 🎨 Composants React

### 1. `BroadcastMessageModal.tsx` (Admin)
Modal pour envoyer des messages groupés.

**Props :**
- `isOpen` (boolean) - Modal ouvert/fermé
- `onClose` (function) - Callback de fermeture

**Fonctionnalités :**
- ✅ Ciblage : Tous / En retard / Ayant validé
- ✅ Sélection du jour (pour ciblage spécifique)
- ✅ Titre et message
- ✅ Compteur de caractères
- ✅ Validation avant envoi
- ✅ Feedback de succès
- ✅ Gestion d'erreur

**Utilisation :**
```tsx
import BroadcastMessageModal from '../components/BroadcastMessageModal';

const [isModalOpen, setIsModalOpen] = useState(false);

<BroadcastMessageModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
/>
```

### 2. `MessagesInbox.tsx` (Participant)
Boîte de réception pour les participants.

**Props :**
- `isOpen` (boolean) - Inbox ouvert/fermé
- `onClose` (function) - Callback de fermeture

**Fonctionnalités :**
- ✅ Liste des messages reçus
- ✅ Badge non lu
- ✅ Détail du message
- ✅ Marquage automatique comme lu
- ✅ Formatage des dates
- ✅ Responsive (liste + détail sur desktop)

**Utilisation :**
```tsx
import MessagesInbox from '../components/MessagesInbox';

const [isInboxOpen, setIsInboxOpen] = useState(false);

<MessagesInbox
    isOpen={isInboxOpen}
    onClose={() => setIsInboxOpen(false)}
/>
```

---

## 🚀 Cas d'Usage

### 1. Message à Tous les Participants
**Scénario :** Annonce générale

```typescript
// L'admin sélectionne "Tous les candidats"
// Écrit le message
// Clique sur "Envoyer"

// Résultat :
// - Tous les participants inscrits reçoivent le message
// - Chacun voit le message dans sa boîte de réception
```

### 2. Rappel aux Retardataires
**Scénario :** Rappel pour ceux qui n'ont pas soumis aujourd'hui

```typescript
// L'admin sélectionne "En retard (jour actif)"
// Le système trouve automatiquement le jour actif
// Identifie les participants sans soumission
// Envoie le rappel uniquement à eux

// Résultat :
// - Seuls les participants en retard reçoivent le message
// - Message ciblé et pertinent
```

### 3. Félicitations aux Validés
**Scénario :** Féliciter ceux qui ont validé un jour spécifique

```typescript
// L'admin sélectionne "Ayant validé un jour"
// Choisit le jour (ex: Jour 5)
// Écrit un message de félicitations
// Envoie

// Résultat :
// - Seuls les participants ayant validé le jour 5 reçoivent le message
// - Motivation et reconnaissance
```

---

## 📱 Interface Utilisateur

### Pour les Admins (BroadcastMessageModal)

#### Étapes d'Envoi
1. **Sélection des destinataires**
   - 3 boutons avec icônes
   - Tous / En retard / Ayant validé
   - Sélection du jour si nécessaire

2. **Rédaction du message**
   - Champ titre (100 caractères max)
   - Champ message (1000 caractères max)
   - Compteurs en temps réel

3. **Envoi**
   - Bouton "Envoyer le message"
   - Spinner pendant l'envoi
   - Message de succès avec nombre de destinataires

#### Design
- Glass morphism
- Gradient bleu-violet
- Animations fluides
- Responsive

### Pour les Participants (MessagesInbox)

#### Vue Liste
- Messages triés par date (plus récent en premier)
- Badge bleu pour non lus
- Aperçu du message (2 lignes)
- Nom de l'expéditeur
- Date formatée (relative)
- Jour concerné (si applicable)

#### Vue Détail (Desktop)
- Titre en grand
- Métadonnées (expéditeur, date, jour)
- Message complet
- Formatage préservé (whitespace-pre-wrap)

#### Fonctionnalités
- Clic sur message → Marquage automatique comme lu
- Compteur de non lus dans le header
- Scroll indépendant liste/détail

---

## 🔒 Sécurité (RLS)

### Policies `admin_broadcasts`
- **INSERT** : Seuls les ambassadeurs
- **SELECT** : Seuls les ambassadeurs

### Policies `broadcast_recipients`
- **INSERT** : Seuls les ambassadeurs
- **SELECT** : Utilisateur voit ses propres messages
- **UPDATE** : Utilisateur peut marquer ses messages comme lus

---

## 📊 Métriques

### Pour les Admins
- Nombre de messages envoyés
- Nombre de destinataires par message
- Type de ciblage utilisé
- Jour concerné

### Pour les Participants
- Nombre de messages reçus
- Nombre de messages non lus
- Taux de lecture

---

## 🎯 Prochaines Étapes

### Court Terme
- [ ] Appliquer la migration SQL
- [ ] Intégrer BroadcastMessageModal dans AdminDashboard
- [ ] Intégrer MessagesInbox dans Dashboard participant
- [ ] Ajouter badge de notification (nombre de non lus)
- [ ] Tester avec données réelles

### Moyen Terme
- [ ] Historique des messages envoyés (admin)
- [ ] Statistiques de lecture
- [ ] Templates de messages
- [ ] Programmation d'envoi différé

### Long Terme
- [ ] Réponses aux messages
- [ ] Messages individuels (1-to-1)
- [ ] Pièces jointes
- [ ] Notifications push

---

## 📝 Checklist d'Intégration

### Étape 1 : Migration Base de Données
```bash
# Appliquer la migration
supabase db push

# Ou via l'interface Supabase
# Copier le contenu de add_admin_broadcast_system.sql
# Exécuter dans SQL Editor
```

### Étape 2 : Intégration Admin
```tsx
// Dans AdminDashboard.tsx
import BroadcastMessageModal from '../components/BroadcastMessageModal';

// Ajouter un bouton dans le header
<button onClick={() => setIsBroadcastOpen(true)}>
    <Send className="w-5 h-5" />
    Envoyer un message
</button>

// Ajouter le modal
<BroadcastMessageModal
    isOpen={isBroadcastOpen}
    onClose={() => setIsBroadcastOpen(false)}
/>
```

### Étape 3 : Intégration Participant
```tsx
// Dans Dashboard.tsx
import MessagesInbox from '../components/MessagesInbox';

// Ajouter un bouton dans le header
<button onClick={() => setIsInboxOpen(true)}>
    <Bell className="w-5 h-5" />
    {unreadCount > 0 && (
        <span className="badge">{unreadCount}</span>
    )}
</button>

// Ajouter l'inbox
<MessagesInbox
    isOpen={isInboxOpen}
    onClose={() => setIsInboxOpen(false)}
/>
```

### Étape 4 : Tests
- [ ] Envoyer message à tous
- [ ] Envoyer message aux retardataires
- [ ] Envoyer message aux validés
- [ ] Vérifier réception participant
- [ ] Tester marquage comme lu
- [ ] Vérifier compteur non lus

---

## 🎊 Résultat Final

Un système de messagerie complet permettant :
- ✅ Communication admin → participants
- ✅ Ciblage intelligent
- ✅ Interface intuitive
- ✅ Gestion des non lus
- ✅ Responsive
- ✅ Sécurisé (RLS)

---

*Document créé le 3 janvier 2026*
*Système de messagerie admin-participants*
