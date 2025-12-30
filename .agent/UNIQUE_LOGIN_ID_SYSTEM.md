# Système d'Identifiant Unique de Connexion - Marathon Challenge

## 📋 Vue d'ensemble

Le système d'identifiant unique permet aux participants du Marathon Challenge de se connecter facilement à leur compte en utilisant un identifiant unique au format `MC-XXXX-XXXX`.

## 🔑 Fonctionnalités implémentées

### 1. **Base de données**
- Ajout du champ `unique_login_id` dans la table `profiles`
- Génération automatique d'identifiants uniques au format `MC-XXXX-XXXX`
- Trigger SQL pour générer l'identifiant lors de l'inscription
- Index pour optimiser les recherches

### 2. **Processus d'inscription**
Lorsqu'un nouveau participant s'inscrit via "Participer au Challenge" :
1. Il remplit le formulaire d'inscription (Onboarding)
2. Un identifiant unique est automatiquement généré par la base de données
3. Un modal s'affiche avec l'identifiant unique
4. Le participant peut copier cet identifiant
5. L'identifiant est nécessaire pour les prochaines connexions

### 3. **Page de connexion rapide** (`/quick-login`)
- Interface dédiée pour la connexion avec identifiant unique
- Validation de l'identifiant en temps réel
- Messages d'erreur clairs
- Lien vers l'inscription pour les nouveaux participants

### 4. **Navigation**
- **Leaderboard** : Le bouton "Se Connecter" redirige vers `/quick-login`
- **Quick Login** : Le bouton "Participer au Challenge" redirige vers `/login` (inscription Google)

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers :
1. **`.agent/add-unique-login-id.sql`** - Script SQL pour ajouter le système d'identifiant unique
2. **`src/pages/QuickLogin.tsx`** - Page de connexion avec identifiant unique
3. **`src/components/UniqueIdModal.tsx`** - Modal pour afficher l'identifiant après inscription

### Fichiers modifiés :
1. **`src/types/database.ts`** - Ajout du champ `unique_login_id` dans l'interface Profile
2. **`src/pages/Onboarding.tsx`** - Intégration du modal d'affichage de l'identifiant
3. **`src/pages/Leaderboard.tsx`** - Redirection vers `/quick-login` pour "Se Connecter"
4. **`src/App.tsx`** - Ajout de la route `/quick-login`

## 🚀 Déploiement

### Étape 1 : Exécuter le script SQL
Connectez-vous à votre console Supabase et exécutez le script :
```bash
.agent/add-unique-login-id.sql
```

Ce script va :
- Ajouter la colonne `unique_login_id` à la table `profiles`
- Créer la fonction de génération d'identifiants
- Créer le trigger pour générer automatiquement les identifiants
- Générer des identifiants pour les profils existants

### Étape 2 : Vérifier les permissions
Assurez-vous que les politiques RLS (Row Level Security) permettent :
- La lecture du champ `unique_login_id` pour tous les utilisateurs authentifiés
- La recherche de profils par `unique_login_id`

### Étape 3 : Tester le système
1. Créer un nouveau compte via "Participer au Challenge"
2. Noter l'identifiant unique affiché dans le modal
3. Se déconnecter
4. Cliquer sur "Se Connecter" depuis le Leaderboard
5. Entrer l'identifiant unique
6. Vérifier la redirection vers le dashboard

## 💡 Utilisation

### Pour les nouveaux participants :
1. Cliquer sur "Participer au Challenge" depuis le Leaderboard
2. Se connecter avec Google
3. Remplir le formulaire d'inscription
4. **IMPORTANT** : Noter ou copier l'identifiant unique affiché
5. Utiliser cet identifiant pour les prochaines connexions

### Pour les participants existants :
1. Cliquer sur "Se Connecter" depuis le Leaderboard
2. Entrer l'identifiant unique (format : MC-XXXX-XXXX)
3. Accéder directement au dashboard

## 🔒 Sécurité

**Note importante** : Le système actuel utilise `localStorage` pour stocker temporairement le profil. Dans un environnement de production, vous devriez :

1. Créer une vraie session Supabase Auth
2. Implémenter un système de tokens JWT
3. Ajouter une authentification à deux facteurs (optionnel)
4. Limiter le nombre de tentatives de connexion

## 🎨 Interface utilisateur

### Modal d'identifiant unique
- Design moderne avec animations
- Bouton de copie pour faciliter la sauvegarde
- Instructions claires pour l'utilisation
- Avertissement pour ne pas perdre l'identifiant

### Page de connexion rapide
- Interface épurée et intuitive
- Validation en temps réel
- Messages d'erreur explicites
- Lien vers l'inscription pour les nouveaux

## 📊 Format de l'identifiant

- **Format** : `MC-XXXX-XXXX`
- **MC** : Marathon Challenge
- **XXXX-XXXX** : 8 chiffres aléatoires
- **Exemple** : `MC-1234-5678`

## 🐛 Dépannage

### L'identifiant n'est pas généré
- Vérifier que le trigger SQL est bien créé
- Vérifier que le profil a `is_registered = true`
- Consulter les logs Supabase

### Connexion impossible avec l'identifiant
- Vérifier le format (MC-XXXX-XXXX)
- Vérifier que l'identifiant existe dans la base
- Vérifier que le profil est bien enregistré (`is_registered = true`)

### Le modal ne s'affiche pas
- Vérifier que le profil a bien un `unique_login_id`
- Vérifier les logs de la console navigateur
- Vérifier que la requête SQL retourne bien l'identifiant

## 📝 Améliorations futures possibles

1. **Email de confirmation** : Envoyer l'identifiant par email après inscription
2. **Récupération d'identifiant** : Permettre aux ambassadeurs de récupérer l'identifiant d'un participant
3. **QR Code** : Générer un QR code avec l'identifiant
4. **Historique de connexion** : Tracker les connexions pour la sécurité
5. **Changement d'identifiant** : Permettre de régénérer un identifiant (avec validation ambassadeur)
