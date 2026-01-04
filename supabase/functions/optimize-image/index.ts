import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const imageUrl = url.searchParams.get('url')
        const width = parseInt(url.searchParams.get('width') || '800')
        const quality = parseInt(url.searchParams.get('quality') || '80')

        if (!imageUrl) {
            return new Response(
                JSON.stringify({ error: 'Missing image URL' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Fetch the original image
        const imageResponse = await fetch(imageUrl)

        if (!imageResponse.ok) {
            return new Response(
                JSON.stringify({ error: 'Failed to fetch image' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const imageBuffer = await imageResponse.arrayBuffer()

        // For now, we'll just return the image with cache headers
        // In production, you would use an image processing library like Sharp
        // But Deno Edge Functions have limitations with native modules

        return new Response(imageBuffer, {
            headers: {
                ...corsHeaders,
                'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
            },
        })
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
