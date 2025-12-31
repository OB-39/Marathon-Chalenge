# Profile Edit RLS Error - Resolution

## Problem Summary

Users were encountering a **Row-Level Security (RLS) policy violation** error when attempting to edit their profile:

```
StorageApiError: new row violates row-level security policy
```

Additionally, avatar images were failing to load with a 400 error from Supabase Storage.

## Root Cause

The issue was caused by the **Quick Login** authentication method. When users log in via Quick Login:

1. **No Supabase Session**: The authentication only stores user data in `sessionStorage` without creating a proper Supabase authentication session
2. **No RLS Context**: Supabase's Row-Level Security policies require an authenticated session to verify user permissions
3. **Storage Access Denied**: The storage bucket also relies on RLS policies, which reject operations without proper authentication

### Technical Details

In `AuthContext.tsx`, the Quick Login creates a minimal user object:

```typescript
// Quick login creates this minimal user without a real session
setUser({ id: data.id, email: data.email } as User);
// But session remains null
setSession(null);
```

When `EditProfileModal.tsx` tries to update the profile or upload an avatar, Supabase checks the session token for RLS policies. Without a valid session, the operation is rejected.

## Solution Implemented

### 1. Session Validation
Added a check to verify if the user has a valid Supabase session:

```typescript
const { user, profile, session, refreshProfile } = useAuth();
const hasValidSession = !!session;
```

### 2. User Warning
Display a clear warning message when users don't have a valid session:

```tsx
{!hasValidSession && (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex gap-3">
            <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Connexion requise
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                    Pour modifier votre profil et télécharger une photo, vous devez vous connecter avec Google. 
                    La connexion rapide ne permet pas ces modifications pour des raisons de sécurité.
                </p>
            </div>
        </div>
    </div>
)}
```

### 3. Disabled Form Fields
All form inputs and the submit button are disabled when there's no valid session:

```tsx
<input
    type="tel"
    value={formData.phoneNumber}
    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
    className="... disabled:opacity-50 disabled:cursor-not-allowed"
    disabled={!hasValidSession}
/>
```

### 4. Enhanced Error Handling
Improved error messages to help users understand what went wrong:

```typescript
if (updateError) {
    console.error('Update error:', updateError);
    if (updateError.message.includes('row-level security')) {
        throw new Error('Erreur de sécurité: Veuillez vous reconnecter avec Google.');
    }
    throw new Error(`Erreur de mise à jour: ${updateError.message}`);
}
```

### 5. Pre-submit Validation
Added a check before attempting to submit the form:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier la session avant de soumettre
    if (!hasValidSession) {
        alert('Vous devez vous connecter avec Google pour modifier votre profil.');
        return;
    }
    
    setLoading(true);
    // ... rest of the code
};
```

## User Experience

### Before Fix
- Users with Quick Login could open the edit profile modal
- Attempting to save changes resulted in a cryptic error
- No indication of what was wrong or how to fix it

### After Fix
- Users with Quick Login see a clear warning message
- All form fields are visually disabled
- The submit button is disabled
- Clear instructions on what they need to do (sign in with Google)
- Better error messages if something still goes wrong

## Alternative Solutions Considered

### Option 1: Modify RLS Policies (Not Recommended)
We could have modified the Supabase RLS policies to allow updates without a session, but this would:
- Compromise security
- Require database access
- Create potential security vulnerabilities

### Option 2: Create a Backend Proxy (Overkill)
We could have created a backend service to handle profile updates, but this would:
- Add unnecessary complexity
- Require additional infrastructure
- Not solve the underlying authentication issue

## Testing Recommendations

1. **Test Quick Login Users**:
   - Log in via Quick Login
   - Attempt to edit profile
   - Verify warning message appears
   - Verify all fields are disabled

2. **Test Google OAuth Users**:
   - Log in via Google OAuth
   - Edit profile successfully
   - Upload avatar successfully
   - Verify changes persist

3. **Test Error Scenarios**:
   - Test with network issues
   - Test with invalid file types
   - Test with oversized images

## Files Modified

- `src/components/EditProfileModal.tsx`: Added session validation, warning UI, and disabled states

## Related Issues

This fix also prevents the avatar loading error (400 status) because:
- Users without valid sessions won't be able to upload avatars
- The warning message guides them to sign in properly
- Once signed in with Google, they'll have the necessary permissions

## Future Improvements

Consider one of these approaches:

1. **Remove Quick Login**: If profile editing is essential, consider removing the Quick Login feature entirely
2. **Upgrade Quick Login**: Modify Quick Login to create a proper Supabase session (requires backend changes)
3. **Read-Only Quick Login**: Make it clear that Quick Login is for viewing only, not editing
