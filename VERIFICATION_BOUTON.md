# 🔍 Vérification du bouton "Message groupé"

## ✅ Le serveur est démarré

Le serveur de développement tourne sur : **http://localhost:5173/**

## 📋 Checklist pour voir le bouton

### 1. Actualiser la page
- Appuyez sur **Ctrl + Shift + R** (Windows) ou **Cmd + Shift + R** (Mac)
- Ou appuyez sur **F5**
- Cela force le rechargement complet de la page

### 2. Vérifier que vous êtes connecté en tant qu'ambassadeur

Le bouton "Message groupé" n'apparaît **QUE** pour les ambassadeurs.

**Comment vérifier :**
1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Console"
3. Taper : `localStorage.getItem('supabase.auth.token')`
4. Vérifier votre profil dans Supabase Dashboard

**Si vous n'êtes pas ambassadeur :**
- Le bouton ne s'affichera pas (c'est normal)
- Vous devez vous connecter avec un compte ambassadeur

### 3. Aller dans la section "Messagerie Privée"

Le bouton se trouve dans la section **"Messagerie Privée"** du Dashboard.

**Chemin :**
1. Aller sur http://localhost:5173/
2. Se connecter
3. Aller dans le Dashboard
4. Scroller jusqu'à la section "Messagerie Privée"
5. Le bouton devrait être en haut à droite de cette section

### 4. Vérifier la console pour les erreurs

Si le bouton n'apparaît toujours pas :

1. Ouvrir la console du navigateur (F12)
2. Aller dans l'onglet "Console"
3. Chercher des erreurs en rouge
4. Copier les erreurs et me les envoyer

## 🐛 Problèmes possibles

### Problème 1 : Erreur "Button is not defined"

**Solution :**
Vérifier que le fichier `src/components/ui/Button.tsx` existe.

### Problème 2 : Erreur "BroadcastMessageModal is not defined"

**Solution :**
Vérifier que le fichier `src/components/BroadcastMessageModal.tsx` existe.

### Problème 3 : Le bouton n'apparaît pas mais pas d'erreur

**Causes possibles :**
1. Vous n'êtes pas connecté en tant qu'ambassadeur
2. La page n'a pas été actualisée
3. Le cache du navigateur

**Solutions :**
1. Vider le cache : Ctrl + Shift + Delete
2. Actualiser : Ctrl + Shift + R
3. Vérifier votre rôle dans Supabase

## 🔍 Vérification manuelle du code

### Vérifier que le composant est bien importé

Ouvrir `src/components/PrivateMessagesSection.tsx` et vérifier :

```typescript
import BroadcastMessageModal from './BroadcastMessageModal';
```

### Vérifier que le bouton est bien dans le code

Chercher dans le fichier :

```typescript
{profile?.role === 'ambassador' && (
    <Button
        onClick={() => setShowBroadcastModal(true)}
        size="sm"
        className="btn-primary-neo"
    >
        <Send className="w-4 h-4 mr-2" />
        Message groupé
    </Button>
)}
```

## 📸 À quoi ressemble le bouton

Le bouton devrait ressembler à ça :

```
┌─────────────────────────────────────────────┐
│ Messagerie Privée          [Message groupé] │
└─────────────────────────────────────────────┘
```

- **Position** : En haut à droite de la section "Messagerie Privée"
- **Couleur** : Bleu avec effet de gradient
- **Icône** : Icône d'envoi (Send) à gauche du texte
- **Texte** : "Message groupé"

## 🚀 Test rapide

Pour tester rapidement si tout fonctionne :

1. Ouvrir http://localhost:5173/
2. Se connecter en tant qu'ambassadeur
3. Aller dans le Dashboard
4. Chercher "Messagerie Privée"
5. Le bouton devrait être visible en haut à droite

Si vous ne voyez toujours pas le bouton après ces étapes, envoyez-moi :
- Une capture d'écran de la section "Messagerie Privée"
- Les erreurs de la console (F12)
- Votre rôle (student ou ambassador)

## 💡 Astuce

Pour vérifier rapidement votre rôle :

1. Ouvrir la console (F12)
2. Taper :
```javascript
// Vérifier le profil
const { data } = await supabase.auth.getUser();
console.log('User ID:', data.user.id);

// Vérifier le rôle
const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
console.log('Role:', profile.role);
```

Si `profile.role` est `'ambassador'`, le bouton devrait apparaître.
Si c'est `'student'`, le bouton ne s'affichera pas (c'est normal).
