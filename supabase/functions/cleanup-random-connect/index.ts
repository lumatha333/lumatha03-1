import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Delete expired memories (older than 24 hours)
    const { data: deletedMemories, error: memoriesError } = await supabase
      .from('random_connect_memories')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (memoriesError) {
      console.error('Error deleting expired memories:', memoriesError);
    }

    // Delete expired text memory (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: deletedTextMemory, error: textMemoryError } = await supabase
      .from('random_connect_text_memory')
      .delete()
      .lt('created_at', twentyFourHoursAgo)
      .select('id');

    if (textMemoryError) {
      console.error('Error deleting expired text memory:', textMemoryError);
    }

    // Delete expired reconnect requests
    const { data: deletedRequests, error: requestsError } = await supabase
      .from('random_connect_reconnect_requests')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (requestsError) {
      console.error('Error deleting expired reconnect requests:', requestsError);
    }

    // Clean up stale queue entries (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: deletedQueue, error: queueError } = await supabase
      .from('random_connect_queue')
      .delete()
      .lt('created_at', fiveMinutesAgo)
      .select('id');

    if (queueError) {
      console.error('Error cleaning up queue:', queueError);
    }

    // Archive old sessions (older than 24 hours)
    const { data: updatedSessions, error: sessionsError } = await supabase
      .from('random_connect_sessions')
      .update({ status: 'archived' })
      .eq('status', 'ended')
      .lt('ended_at', twentyFourHoursAgo)
      .select('id');

    if (sessionsError) {
      console.error('Error archiving old sessions:', sessionsError);
    }

    const summary = {
      deletedMemories: deletedMemories?.length || 0,
      deletedTextMemory: deletedTextMemory?.length || 0,
      deletedRequests: deletedRequests?.length || 0,
      deletedQueue: deletedQueue?.length || 0,
      archivedSessions: updatedSessions?.length || 0,
      timestamp: now,
    };

    console.log('Cleanup completed:', summary);

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
