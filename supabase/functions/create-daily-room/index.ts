import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      console.error("DAILY_API_KEY secret is not configured");
      return new Response(
        JSON.stringify({ error: "DAILY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { sessionId, mode } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a unique room name from the session ID
    const roomName = `rc-${sessionId.replace(/-/g, "").slice(0, 20)}`;

    console.log("Creating Daily room:", roomName, "mode:", mode);

    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "public",
        properties: {
          enable_screenshare: false,
          enable_chat: false,
          enable_knocking: false,
          start_video_off: mode === "audio",
          start_audio_off: false,
          exp: Math.floor(Date.now() / 1000) + 3600,
          enable_network_ui: false,
          enable_prejoin_ui: false,
          max_participants: 2,
          eject_at_room_exp: true,
        },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("Daily API error status:", response.status, "body:", responseText);

      // If room already exists (409 or name collision in 400), fetch it
      if (response.status === 400 || response.status === 409) {
        console.log("Room may already exist, trying to fetch:", roomName);
        const getResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
          headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
        });
        const getBody = await getResponse.text();
        if (getResponse.ok) {
          const existingRoom = JSON.parse(getBody);
          console.log("Found existing room:", existingRoom.url);
          return new Response(
            JSON.stringify({ url: existingRoom.url, name: existingRoom.name }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.error("Fetch existing room failed:", getResponse.status, getBody);
      }

      return new Response(
        JSON.stringify({ error: "Failed to create room", details: responseText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const room = JSON.parse(responseText);
    console.log("Created Daily room:", room.name, "url:", room.url);

    return new Response(
      JSON.stringify({ url: room.url, name: room.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
