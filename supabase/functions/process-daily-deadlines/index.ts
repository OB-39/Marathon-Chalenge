import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        // Créer le client Supabase avec la clé service role
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const now = new Date()
        console.log(`🕐 [${now.toISOString()}] Processing deadlines...`)

        // 1. Trouver les jours dont la deadline est expirée
        const { data: expiredDays, error: daysError } = await supabaseClient
            .from('challenge_days')
            .select('*')
            .lte('deadline', now.toISOString())
            .eq('is_expired', false)

        if (daysError) {
            console.error('❌ Error fetching expired days:', daysError)
            throw daysError
        }

        console.log(`📅 Found ${expiredDays?.length || 0} expired day(s)`)

        if (!expiredDays || expiredDays.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No expired days to process',
                    processedDays: 0,
                    timestamp: now.toISOString()
                }),
                { headers: { 'Content-Type': 'application/json' } }
            )
        }

        let totalMissedSubmissions = 0

        for (const day of expiredDays) {
            console.log(`⏰ Processing Day ${day.day_number} - Deadline: ${day.deadline}`)

            // 2. Récupérer tous les participants actifs
            const { data: participants, error: participantsError } = await supabaseClient
                .from('profiles')
                .select('id, full_name, email')
                .eq('is_registered', true)
                .eq('role', 'student')

            if (participantsError) {
                console.error('❌ Error fetching participants:', participantsError)
                throw participantsError
            }

            console.log(`👥 Found ${participants?.length || 0} active participant(s)`)

            // 3. Récupérer les soumissions existantes pour ce jour
            const { data: existingSubmissions, error: submissionsError } = await supabaseClient
                .from('submissions')
                .select('user_id')
                .eq('day_number', day.day_number)

            if (submissionsError) {
                console.error('❌ Error fetching submissions:', submissionsError)
                throw submissionsError
            }

            const submittedUserIds = new Set(existingSubmissions?.map(s => s.user_id) || [])
            console.log(`📝 ${submittedUserIds.size} participant(s) already submitted`)

            // 4. Trouver les participants qui n'ont pas soumis
            const missedParticipants = participants?.filter(
                p => !submittedUserIds.has(p.id)
            ) || []

            console.log(`❌ ${missedParticipants.length} participant(s) missed the deadline`)

            // 5. Créer des soumissions avec 0 points pour ceux qui ont manqué
            if (missedParticipants.length > 0) {
                const missedSubmissions = missedParticipants.map(participant => ({
                    user_id: participant.id,
                    day_number: day.day_number,
                    platform: 'linkedin', // Valeur par défaut requise
                    post_link: '',
                    content_text: null,
                    proof_image_url: null,
                    status: 'rejected',
                    score_awarded: 0,
                    missed_deadline: true,
                    feedback: `Deadline manquée - 0 points attribués automatiquement le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`,
                    submitted_at: now.toISOString(),
                    created_at: now.toISOString()
                }))

                const { error: insertError } = await supabaseClient
                    .from('submissions')
                    .insert(missedSubmissions)

                if (insertError) {
                    console.error('❌ Error creating missed submissions:', insertError)
                    throw insertError
                }

                console.log(`✅ Created ${missedSubmissions.length} missed submission(s) with 0 points`)
                totalMissedSubmissions += missedSubmissions.length
            }

            // 6. Marquer le jour comme expiré
            const { error: updateError } = await supabaseClient
                .from('challenge_days')
                .update({ is_expired: true })
                .eq('day_number', day.day_number)

            if (updateError) {
                console.error('❌ Error marking day as expired:', updateError)
                throw updateError
            }

            console.log(`🔒 Marked Day ${day.day_number} as expired`)

            // 7. Activer le jour suivant (si existe et pas déjà actif)
            const nextDay = day.day_number + 1
            if (nextDay <= 15) {
                const { error: activateError } = await supabaseClient
                    .from('challenge_days')
                    .update({ is_active: true })
                    .eq('day_number', nextDay)

                if (activateError) {
                    console.error('❌ Error activating next day:', activateError)
                    throw activateError
                }

                console.log(`🚀 Activated Day ${nextDay}`)
            } else {
                console.log(`🏁 Challenge completed! Day ${day.day_number} was the last day.`)
            }
        }

        const response = {
            success: true,
            processedDays: expiredDays.length,
            totalMissedSubmissions,
            timestamp: now.toISOString(),
            details: expiredDays.map(d => ({
                dayNumber: d.day_number,
                deadline: d.deadline
            }))
        }

        console.log(`✅ Processing completed successfully:`, response)

        return new Response(
            JSON.stringify(response),
            { headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('❌ Fatal error processing deadlines:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
})

/* 
DÉPLOIEMENT :

1. Déployer cette fonction :
   supabase functions deploy process-daily-deadlines

2. Configurer le cron job dans Supabase Dashboard :
   - Aller dans Edge Functions > Cron Jobs
   - Créer un nouveau cron job :
     * Nom : process-daily-deadlines
     * Schedule : "0 * * * *" (toutes les heures)
     * Function : process-daily-deadlines

3. Tester manuellement :
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-daily-deadlines \
     -H "Authorization: Bearer YOUR_ANON_KEY"

4. Vérifier les logs :
   supabase functions logs process-daily-deadlines

NOTES :
- La fonction utilise SUPABASE_SERVICE_ROLE_KEY pour contourner RLS
- Exécution idempotente : peut être appelée plusieurs fois sans effet secondaire
- Les logs détaillés permettent de suivre chaque étape
*/
