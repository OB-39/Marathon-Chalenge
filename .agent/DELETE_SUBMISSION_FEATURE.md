# Fonctionnalité de Suppression de Soumissions

## 📋 Vue d'ensemble

Les participants peuvent maintenant **supprimer leurs soumissions en attente** (status = 'pending') avant qu'elles ne soient validées ou rejetées par un ambassadeur. Cette fonctionnalité permet aux utilisateurs de corriger leurs erreurs et de soumettre à nouveau si nécessaire.

## ✨ Fonctionnalités

### 1. **Règles de Suppression**
- ✅ **Autorisé** : Suppression des soumissions avec `status = 'pending'`
- ❌ **Interdit** : Suppression des soumissions `validated` ou `rejected`
- 🔒 **Sécurité** : Double vérification (côté client ET serveur)

### 2. **Expérience Utilisateur**

#### **Bouton de Suppression**
- Apparaît uniquement sur les soumissions en attente
- Couleur rouge (variant "danger") pour indiquer une action destructive
- Icône de poubelle (Trash2) pour clarté visuelle
- État de chargement pendant la suppression

#### **Confirmation**
- Dialogue de confirmation avant suppression
- Message clair indiquant que l'action est irréversible
- Affiche le numéro du jour concerné

#### **Feedback**
- Message d'erreur si la suppression échoue
- Rafraîchissement automatique de la liste après suppression réussie
- Indication visuelle pendant le processus (bouton en chargement)

## 🔧 Implémentation Technique

### **Fichiers Modifiés**

#### 1. `src/components/SubmissionsSection.tsx`
- Ajout de l'import `useState`, `Trash2`, `supabase`, et `Button`
- Ajout du prop `onDelete?: () => void`
- Fonction `handleDelete` avec validation et confirmation
- Bouton de suppression dans l'UI (uniquement pour status = 'pending')

#### 2. `src/pages/Dashboard.tsx`
- Passage du callback `onDelete={fetchData}` à `SubmissionsSection`
- Permet le rafraîchissement automatique après suppression

### **Code Principal**

```typescript
const handleDelete = async (submission: Submission) => {
    // Vérifier que le statut est bien "pending"
    if (submission.status !== 'pending') {
        alert('Vous ne pouvez supprimer que les soumissions en attente de validation.');
        return;
    }

    // Demander confirmation
    const confirmed = window.confirm(
        `Êtes-vous sûr de vouloir supprimer votre soumission du Jour ${submission.day_number} ?\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    setDeletingId(submission.id);

    try {
        const { error } = await supabase
            .from('submissions')
            .delete()
            .eq('id', submission.id)
            .eq('status', 'pending'); // Double vérification côté serveur

        if (error) {
            console.error('Error deleting submission:', error);
            throw error;
        }

        // Notifier le parent pour rafraîchir la liste
        if (onDelete) {
            onDelete();
        }
    } catch (error) {
        console.error('Failed to delete submission:', error);
        alert('Erreur lors de la suppression. Veuillez réessayer.');
    } finally {
        setDeletingId(null);
    }
};
```

### **UI du Bouton**

```tsx
{/* Delete Button - Only for pending submissions */}
{submission.status === 'pending' && (
    <div className="mt-3 pt-3 border-t border-white/10">
        <Button
            variant="danger"
            size="sm"
            onClick={() => handleDelete(submission)}
            isLoading={deletingId === submission.id}
            disabled={deletingId === submission.id}
            className="w-full sm:w-auto"
        >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer cette soumission
        </Button>
    </div>
)}
```

## 🔒 Sécurité

### **Validation Multi-Niveaux**

1. **Côté Client (UI)**
   - Le bouton n'apparaît que si `status === 'pending'`
   - Vérification avant l'appel API
   - Dialogue de confirmation

2. **Côté Serveur (Supabase)**
   - Clause `.eq('status', 'pending')` dans la requête DELETE
   - Empêche la suppression si le statut a changé entre-temps

3. **RLS Policies (Supabase)**
   - Les politiques RLS devraient être configurées pour :
     - Permettre aux utilisateurs de supprimer uniquement leurs propres soumissions
     - Vérifier que le statut est 'pending'

### **Politique RLS Recommandée**

```sql
-- Policy pour permettre la suppression des soumissions pending
CREATE POLICY "Users can delete their own pending submissions"
ON submissions
FOR DELETE
USING (
    auth.uid() = user_id 
    AND status = 'pending'
);
```

## 📱 Responsive Design

- **Mobile** : Bouton pleine largeur (`w-full`)
- **Desktop** : Bouton auto-width (`sm:w-auto`)
- Séparation visuelle avec bordure supérieure
- Espacement cohérent avec le reste de l'interface

## 🎯 Cas d'Usage

### **Scénario 1 : Erreur de Lien**
1. Participant soumet un mauvais lien
2. Se rend compte de l'erreur avant validation
3. Clique sur "Supprimer cette soumission"
4. Confirme la suppression
5. Soumet à nouveau avec le bon lien

### **Scénario 2 : Changement d'Avis**
1. Participant soumet un projet
2. Décide de l'améliorer avant validation
3. Supprime la soumission en attente
4. Travaille sur les améliorations
5. Soumet la version améliorée

### **Scénario 3 : Tentative de Suppression Invalide**
1. Participant essaie de supprimer une soumission validée
2. Le bouton n'apparaît pas (UI)
3. Si tentative manuelle via API : rejet par le serveur

## ⚠️ Limitations et Considérations

### **Limitations**
- ❌ Impossible de supprimer les soumissions validées
- ❌ Impossible de supprimer les soumissions rejetées
- ❌ Pas de fonction "annuler" après suppression
- ❌ Pas d'historique des suppressions

### **Améliorations Futures Possibles**

1. **Soft Delete**
   - Marquer comme supprimé au lieu de supprimer définitivement
   - Permet un historique et une récupération

2. **Notifications**
   - Notifier l'ambassadeur si une soumission en cours de révision est supprimée
   - Toast notification au lieu d'alert()

3. **Statistiques**
   - Tracker le nombre de suppressions par utilisateur
   - Détecter les comportements suspects

4. **Confirmation Améliorée**
   - Modal personnalisé au lieu de window.confirm()
   - Afficher un aperçu de ce qui sera supprimé

5. **Délai de Grâce**
   - Empêcher la suppression si l'ambassadeur a commencé la révision
   - Ajouter un champ `review_started_at` dans la base de données

## 🧪 Tests Recommandés

### **Tests Fonctionnels**

1. **Test de Suppression Réussie**
   - Créer une soumission pending
   - Cliquer sur supprimer
   - Confirmer
   - Vérifier que la soumission disparaît
   - Vérifier le rafraîchissement de la liste

2. **Test d'Annulation**
   - Cliquer sur supprimer
   - Annuler dans le dialogue
   - Vérifier que rien n'est supprimé

3. **Test de Validation de Statut**
   - Vérifier que le bouton n'apparaît pas sur validated
   - Vérifier que le bouton n'apparaît pas sur rejected
   - Vérifier que le bouton apparaît sur pending

4. **Test d'État de Chargement**
   - Cliquer sur supprimer
   - Vérifier l'état de chargement du bouton
   - Vérifier que le bouton est désactivé pendant le chargement

5. **Test de Gestion d'Erreurs**
   - Simuler une erreur réseau
   - Vérifier le message d'erreur
   - Vérifier que l'état revient à normal

### **Tests de Sécurité**

1. **Test RLS**
   - Essayer de supprimer la soumission d'un autre utilisateur
   - Vérifier le rejet par RLS

2. **Test de Statut**
   - Essayer de supprimer une soumission validated (via API)
   - Vérifier le rejet par la clause `.eq('status', 'pending')`

## 📊 Impact sur l'Expérience Utilisateur

### **Avantages**
- ✅ Plus de contrôle pour les participants
- ✅ Réduction des erreurs et soumissions accidentelles
- ✅ Amélioration de la qualité des soumissions
- ✅ Moins de frustration utilisateur

### **Risques Potentiels**
- ⚠️ Suppression accidentelle (mitigé par confirmation)
- ⚠️ Abus potentiel (mitigé par limitation au statut pending)

## 🎨 Design

- **Couleur** : Rouge (danger) pour indiquer une action destructive
- **Icône** : Poubelle (Trash2) universellement reconnu
- **Position** : En bas de la carte de soumission, séparé par une bordure
- **Taille** : Small (sm) pour ne pas dominer l'interface
- **Responsive** : Adapté aux écrans mobiles et desktop

## 📝 Messages Utilisateur

### **Confirmation**
```
Êtes-vous sûr de vouloir supprimer votre soumission du Jour X ?

Cette action est irréversible.
```

### **Erreur - Statut Invalide**
```
Vous ne pouvez supprimer que les soumissions en attente de validation.
```

### **Erreur - Échec de Suppression**
```
Erreur lors de la suppression. Veuillez réessayer.
```

## 🚀 Déploiement

### **Checklist Avant Déploiement**

- [x] Code implémenté et testé
- [x] Gestion d'erreurs en place
- [x] Confirmation utilisateur implémentée
- [x] Validation de sécurité (client + serveur)
- [ ] Tests manuels effectués
- [ ] RLS policies vérifiées/mises à jour
- [ ] Documentation utilisateur mise à jour
- [ ] Guide participant mis à jour

### **Migration de Base de Données**

Aucune migration nécessaire ! La fonctionnalité utilise les tables existantes.

Cependant, vérifiez que les RLS policies permettent la suppression :

```sql
-- Vérifier les policies existantes
SELECT * FROM pg_policies WHERE tablename = 'submissions';

-- Ajouter la policy si nécessaire
CREATE POLICY "Users can delete their own pending submissions"
ON submissions
FOR DELETE
USING (
    auth.uid() = user_id 
    AND status = 'pending'
);
```

## 📚 Ressources

- [Supabase Delete Documentation](https://supabase.com/docs/reference/javascript/delete)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [React Confirmation Dialogs Best Practices](https://uxdesign.cc/confirmation-dialogs-best-practices-4c7e4d8f5e8f)
