# 🔍 Guide de Dépannage - Messages Non Affichés

## Problème : Les messages ne s'affichent pas dans l'inbox

---

## ✅ Checklist de Vérification

### 1. **Migration SQL Appliquée ?**

#### Vérifier dans Supabase Dashboard
1. Aller sur `dashboard.supabase.com`
2. Sélectionner votre projet
3. Aller dans **Table Editor**
4. Vérifier que ces tables existent :
   - ✅ `admin_broadcasts`
   - ✅ `broadcast_recipients`

#### Si les tables n'existent pas :
```sql
-- Copier tout le contenu de :
-- supabase/migrations/add_admin_broadcast_system.sql

-- Puis aller dans SQL Editor et exécuter
```

---

### 2. **Données Créées ?**

#### Vérifier dans Table Editor

**Table `admin_broadcasts` :**
- Doit contenir au moins 1 ligne
- Colonnes à vérifier :
  - `id` (UUID)
  - `sender_id` (votre ID ambassadeur)
  - `title`
  - `message`
  - `target_type`
  - `recipient_count`

**Table `broadcast_recipients` :**
- Doit contenir autant de lignes que `recipient_count`
- Colonnes à vérifier :
  - `id` (UUID)
  - `broadcast_id` (doit correspondre à un ID dans admin_broadcasts)
  - `recipient_id` (ID du participant)
  - `is_read` (false par défaut)

---

### 3. **Console du Navigateur**

#### Ouvrir la Console (F12)
1. Ouvrir l'inbox des messages
2. Regarder les logs :

```javascript
// Devrait afficher :
Fetched messages: [...]  // Données brutes de Supabase
Formatted messages: [...] // Données formatées
```

#### Si "Fetched messages" est vide `[]` :
- Problème de requête ou de données
- Vérifier que `recipient_id` correspond bien à l'ID du participant connecté

#### Si "Fetched messages" contient des données mais "Formatted messages" est vide :
- Problème de formatage
- Vérifier la structure des données

---

### 4. **Requête SQL Directe**

#### Test dans SQL Editor

```sql
-- Remplacer 'USER_ID' par l'ID du participant
SELECT 
    br.id,
    br.broadcast_id,
    br.is_read,
    br.read_at,
    ab.title,
    ab.message,
    ab.sent_at,
    ab.target_day,
    p.full_name as sender_name
FROM broadcast_recipients br
JOIN admin_broadcasts ab ON ab.id = br.broadcast_id
JOIN profiles p ON p.id = ab.sender_id
WHERE br.recipient_id = 'USER_ID'
ORDER BY br.created_at DESC;
```

**Résultat attendu :**
- Au moins 1 ligne si le participant a reçu des messages
- Toutes les colonnes doivent avoir des valeurs

---

### 5. **RLS (Row Level Security)**

#### Vérifier les Policies

**Pour `broadcast_recipients` :**
```sql
-- Le participant doit pouvoir voir ses messages
SELECT * FROM broadcast_recipients 
WHERE recipient_id = auth.uid();
```

#### Si la policy n'existe pas :
```sql
-- Créer la policy
CREATE POLICY "Users can view their own broadcast messages"
    ON broadcast_recipients FOR SELECT
    TO authenticated
    USING (recipient_id = auth.uid());
```

---

## 🐛 Problèmes Courants

### Problème 1 : "Aucun message" affiché

**Causes possibles :**
1. Migration SQL non appliquée
2. Aucun message envoyé
3. `recipient_id` incorrect
4. RLS bloque l'accès

**Solution :**
```sql
-- Vérifier les données
SELECT COUNT(*) FROM broadcast_recipients 
WHERE recipient_id = 'USER_ID';

-- Si 0 : Aucun message pour ce participant
-- Si > 0 : Problème de RLS ou de requête
```

---

### Problème 2 : Erreur dans la console

**Erreur : "relation broadcast_recipients does not exist"**
- Migration non appliquée
- Appliquer `add_admin_broadcast_system.sql`

**Erreur : "permission denied"**
- RLS bloque l'accès
- Vérifier les policies

**Erreur : "column broadcast_id does not exist"**
- Migration incomplète
- Réappliquer la migration

---

### Problème 3 : Messages affichés mais vides

**Cause :** Problème de jointure ou données nulles

**Solution :**
```typescript
// Dans MessagesInbox.tsx, vérifier les logs :
console.log('Fetched messages:', data);
console.log('Formatted messages:', formattedMessages);

// Si broadcast est null :
// - Vérifier que broadcast_id existe dans admin_broadcasts
// - Vérifier la jointure dans la requête
```

---

## 🔧 Solution Rapide

### Étape 1 : Vérifier les Données

```sql
-- Dans SQL Editor
SELECT 
    ab.id as broadcast_id,
    ab.title,
    ab.message,
    ab.recipient_count,
    COUNT(br.id) as actual_recipients
FROM admin_broadcasts ab
LEFT JOIN broadcast_recipients br ON br.broadcast_id = ab.id
GROUP BY ab.id, ab.title, ab.message, ab.recipient_count;
```

**Résultat attendu :**
- `recipient_count` = `actual_recipients`
- Si différent : Problème lors de la création des recipients

---

### Étape 2 : Test Manuel

```sql
-- Créer un message de test
INSERT INTO admin_broadcasts (sender_id, title, message, target_type, recipient_count)
VALUES (
    'VOTRE_AMBASSADOR_ID',
    'Test Message',
    'Ceci est un test',
    'all',
    1
)
RETURNING id;

-- Utiliser l'ID retourné
INSERT INTO broadcast_recipients (broadcast_id, recipient_id)
VALUES (
    'BROADCAST_ID_FROM_ABOVE',
    'PARTICIPANT_ID'
);
```

---

### Étape 3 : Rafraîchir l'Inbox

1. Fermer l'inbox
2. Rouvrir l'inbox
3. Vérifier la console (F12)
4. Le message de test devrait apparaître

---

## 📝 Commandes Utiles

### Voir tous les broadcasts
```sql
SELECT * FROM admin_broadcasts ORDER BY sent_at DESC;
```

### Voir tous les recipients d'un broadcast
```sql
SELECT 
    br.*,
    p.full_name,
    p.email
FROM broadcast_recipients br
JOIN profiles p ON p.id = br.recipient_id
WHERE br.broadcast_id = 'BROADCAST_ID';
```

### Compter les messages non lus par participant
```sql
SELECT 
    recipient_id,
    COUNT(*) as unread_count
FROM broadcast_recipients
WHERE is_read = false
GROUP BY recipient_id;
```

### Supprimer un broadcast (et ses recipients)
```sql
-- Les recipients sont supprimés automatiquement (CASCADE)
DELETE FROM admin_broadcasts WHERE id = 'BROADCAST_ID';
```

---

## ✅ Checklist Finale

- [ ] Migration SQL appliquée
- [ ] Tables `admin_broadcasts` et `broadcast_recipients` existent
- [ ] Au moins 1 broadcast créé
- [ ] Recipients créés pour le broadcast
- [ ] RLS policies actives
- [ ] Console du navigateur sans erreur
- [ ] Logs "Fetched messages" affichent des données
- [ ] Inbox affiche les messages

---

*Guide de dépannage créé le 3 janvier 2026*
