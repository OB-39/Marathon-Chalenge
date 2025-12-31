import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Créer le client Supabase avec la clé service role (contourne RLS)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Récupérer les données de la requête
        const { userId, phoneNumber, university, bio, avatarUrl } = await req.json()

        // Validation
        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'User ID is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Vérifier que l'utilisateur existe
        const { data: existingProfile, error: fetchError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single()

        if (fetchError || !existingProfile) {
            return new Response(
                JSON.stringify({ error: 'User not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Mettre à jour le profil
        const { data, error } = await supabaseClient
            .from('profiles')
            .update({
                phone_number: phoneNumber || null,
                university: university || null,
                bio: bio || null,
                avatar_url: avatarUrl || null
            })
            .eq('id', userId)
            .select()
            .single()

        if (error) {
            console.error('Error updating profile:', error)
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({ success: true, profile: data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Fatal error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

/* 
DÉPLOIEMENT :

1. Déployer cette fonction :
   supabase functions deploy update-profile

2. Utiliser dans le frontend :
   const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/update-profile', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
     },
     body: JSON.stringify({
       userId: user.id,
       phoneNumber: '...',
       university: '...',
       bio: '...',
       avatarUrl: '...'
     })
   })

SÉCURITÉ :
- Utilise la service_role_key pour contourner RLS
- Valide que l'utilisateur existe avant la mise à jour
- Permet uniquement la mise à jour des champs autorisés
- CORS activé pour permettre les appels depuis le frontend
*/
