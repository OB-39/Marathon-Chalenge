# 🚀 Configuration GitHub Actions - Deadline Automatique

## 📋 Vue d'Ensemble

Puisque les Cron Jobs Supabase ne sont pas disponibles dans le plan gratuit, nous utilisons **GitHub Actions** comme alternative gratuite et fiable.

---

## ✅ **Avantages de GitHub Actions**

- ✅ **100% Gratuit** pour les dépôts publics et privés
- ✅ **Très fiable** (infrastructure de GitHub)
- ✅ **Facile à configurer** (fichier YAML simple)
- ✅ **Logs détaillés** pour chaque exécution
- ✅ **Exécution manuelle** possible en un clic

---

## 🛠️ **Configuration (5 minutes)**

### **Étape 1 : Déployer la Edge Function**

D'abord, assurez-vous que votre Edge Function est déployée sur Supabase :

```bash
# Se connecter à Supabase
supabase login

# Lier votre projet
supabase link --project-ref VOTRE_PROJECT_REF

# Déployer la fonction
supabase functions deploy process-daily-deadlines
```

Vous obtiendrez une URL comme :
```
https://VOTRE_PROJECT.supabase.co/functions/v1/process-daily-deadlines
```

**Notez cette URL !** Vous en aurez besoin.

---

### **Étape 2 : Récupérer votre Anon Key**

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Settings** → **API**
4. Copiez la clé **anon public**

**Notez cette clé !** Vous en aurez besoin.

---

### **Étape 3 : Configurer les Secrets GitHub**

1. Allez sur votre dépôt GitHub : https://github.com/VOTRE_USERNAME/VOTRE_REPO
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu de gauche : **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**

**Créez 2 secrets** :

#### **Secret 1 : SUPABASE_FUNCTION_URL**
- Name : `SUPABASE_FUNCTION_URL`
- Value : `https://VOTRE_PROJECT.supabase.co/functions/v1/process-daily-deadlines`
- Cliquez sur **Add secret**

#### **Secret 2 : SUPABASE_ANON_KEY**
- Name : `SUPABASE_ANON_KEY`
- Value : `votre_anon_key_copiée_à_l_étape_2`
- Cliquez sur **Add secret**

---

### **Étape 4 : Pousser le Workflow sur GitHub**

Le fichier `.github/workflows/process-deadlines.yml` est déjà créé dans votre projet.

```bash
# Ajouter le fichier
git add .github/workflows/process-deadlines.yml

# Commit
git commit -m "Add automated deadline processing with GitHub Actions"

# Pousser sur GitHub
git push origin main
```

---

### **Étape 5 : Vérifier que Ça Fonctionne**

1. Allez sur votre dépôt GitHub
2. Cliquez sur l'onglet **Actions** (en haut)
3. Vous devriez voir le workflow **Process Daily Deadlines**
4. Il s'exécutera automatiquement toutes les heures

---

## 🧪 **Tester Manuellement**

Vous pouvez tester le workflow sans attendre :

1. Allez dans **Actions** sur GitHub
2. Cliquez sur **Process Daily Deadlines** (dans la liste de gauche)
3. Cliquez sur **Run workflow** (bouton à droite)
4. Cliquez sur **Run workflow** (bouton vert)
5. Attendez quelques secondes
6. Cliquez sur l'exécution pour voir les logs

---

## 📊 **Vérifier les Résultats**

Après l'exécution, vérifiez dans votre base de données :

```sql
-- Vérifier les jours expirés
SELECT day_number, deadline, is_expired
FROM challenge_days
WHERE is_expired = TRUE;

-- Vérifier les soumissions automatiques (0 points)
SELECT 
    s.day_number,
    p.full_name,
    s.score_awarded,
    s.missed_deadline,
    s.created_at
FROM submissions s
JOIN profiles p ON s.user_id = p.id
WHERE s.missed_deadline = TRUE
ORDER BY s.day_number, p.full_name;
```

---

## ⏰ **Modifier la Fréquence**

Par défaut, le workflow s'exécute **toutes les heures**.

Pour changer la fréquence, modifiez le fichier `.github/workflows/process-deadlines.yml` :

```yaml
on:
  schedule:
    - cron: '0 * * * *'  # Toutes les heures
    # - cron: '*/30 * * * *'  # Toutes les 30 minutes
    # - cron: '*/15 * * * *'  # Toutes les 15 minutes
    # - cron: '0 */6 * * *'  # Toutes les 6 heures
```

**Format du Cron** :
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Jour de la semaine (0-6, 0 = Dimanche)
│ │ │ └───── Mois (1-12)
│ │ └─────── Jour du mois (1-31)
│ └───────── Heure (0-23)
└─────────── Minute (0-59)
```

**Exemples** :
- `0 * * * *` = Toutes les heures à la minute 0
- `*/30 * * * *` = Toutes les 30 minutes
- `0 6 * * *` = Tous les jours à 6h00
- `0 */2 * * *` = Toutes les 2 heures

---

## 📝 **Logs et Monitoring**

### **Voir les Logs d'Exécution**

1. GitHub → **Actions**
2. Cliquez sur une exécution
3. Cliquez sur **process-deadlines**
4. Vous verrez tous les détails

### **Recevoir des Notifications**

GitHub peut vous envoyer un email si le workflow échoue :

1. GitHub → **Settings** (votre profil)
2. **Notifications**
3. Cochez **Actions** sous "Email notifications"

---

## 🔧 **Dépannage**

### **Problème : Le workflow ne s'exécute pas**

**Vérifications** :
1. Le fichier est bien dans `.github/workflows/` ?
2. Le fichier est bien poussé sur GitHub ?
3. Le dépôt est bien public ou vous avez GitHub Actions activé ?
4. Les secrets sont bien configurés ?

**Solution** :
```bash
# Vérifier que le fichier existe
ls .github/workflows/

# Vérifier qu'il est dans git
git status

# Le pousser si nécessaire
git add .github/workflows/process-deadlines.yml
git commit -m "Add workflow"
git push
```

### **Problème : Erreur 401 (Unauthorized)**

**Cause** : La clé SUPABASE_ANON_KEY est incorrecte

**Solution** :
1. Vérifiez que vous avez copié la bonne clé (anon public, pas service_role)
2. Mettez à jour le secret dans GitHub Settings

### **Problème : Erreur 404 (Not Found)**

**Cause** : L'URL de la fonction est incorrecte

**Solution** :
1. Vérifiez l'URL de votre fonction
2. Assurez-vous qu'elle est bien déployée : `supabase functions list`
3. Mettez à jour le secret SUPABASE_FUNCTION_URL

---

## 🎯 **Workflow Complet**

Voici comment tout fonctionne ensemble :

```
┌─────────────────────────────────────────────────┐
│         SYSTÈME AUTOMATIQUE COMPLET             │
└─────────────────────────────────────────────────┘

1. CONFIGURATION (Une fois)
   ├─ Déployer Edge Function sur Supabase
   ├─ Configurer secrets GitHub
   └─ Pousser workflow sur GitHub

2. EXÉCUTION AUTOMATIQUE (Toutes les heures)
   ↓
   ┌────────────────────────────────────┐
   │  GitHub Actions (Horloge)          │
   │  "Il est XX:00, je lance le job"   │
   └────────────────────────────────────┘
   ↓
   ┌────────────────────────────────────┐
   │  Appel HTTP (curl)                 │
   │  POST vers Edge Function           │
   └────────────────────────────────────┘
   ↓
   ┌────────────────────────────────────┐
   │  Edge Function Supabase            │
   │  1. Vérifie deadlines              │
   │  2. Trouve retardataires           │
   │  3. Attribue 0 points              │
   │  4. Active jour suivant            │
   └────────────────────────────────────┘
   ↓
   ┌────────────────────────────────────┐
   │  Base de Données Mise à Jour       │
   │  Participants voient les résultats │
   └────────────────────────────────────┘
```

---

## 💰 **Coûts**

**GitHub Actions est GRATUIT pour** :
- ✅ Dépôts publics : Illimité
- ✅ Dépôts privés : 2000 minutes/mois (largement suffisant)

**Pour votre cas** :
- 1 exécution = ~5 secondes
- 24 exécutions/jour × 15 jours = 360 exécutions
- 360 × 5 secondes = 1800 secondes = **30 minutes au total**

Vous êtes **très loin** de la limite ! 🎉

---

## 📋 **Checklist de Configuration**

- [ ] Edge Function déployée sur Supabase
- [ ] URL de la fonction notée
- [ ] Anon Key récupérée
- [ ] Secrets configurés dans GitHub
- [ ] Workflow poussé sur GitHub
- [ ] Test manuel effectué
- [ ] Vérification dans la base de données

---

## 🎓 **Résumé**

**GitHub Actions remplace les Cron Jobs Supabase** :
- ✅ Gratuit et fiable
- ✅ Configuration en 5 minutes
- ✅ Fonctionne exactement pareil
- ✅ Logs détaillés disponibles

**Pour activer** :
1. Déployer la Edge Function
2. Configurer 2 secrets GitHub
3. Pousser le workflow
4. C'est tout ! ✨

Le système fonctionne ensuite automatiquement toutes les heures.

---

## 🆘 **Besoin d'Aide ?**

Si vous rencontrez un problème :
1. Vérifiez les logs dans GitHub Actions
2. Testez manuellement la Edge Function avec curl
3. Vérifiez que les secrets sont corrects
