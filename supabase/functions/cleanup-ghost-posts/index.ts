import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate the timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    console.log(`Deleting ghost posts older than: ${twentyFourHoursAgo}`)

    // Delete ghost posts older than 24 hours
    const { data, error, count } = await supabase
      .from('posts')
      .delete()
      .eq('category', 'ghost')
      .lt('created_at', twentyFourHoursAgo)
      .select('id')

    if (error) {
      console.error('Error deleting ghost posts:', error)
      throw error
    }

    const deletedCount = data?.length || 0
    console.log(`Successfully deleted ${deletedCount} ghost posts`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: deletedCount,
        message: `Deleted ${deletedCount} ghost posts older than 24 hours` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in cleanup-ghost-posts function:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
