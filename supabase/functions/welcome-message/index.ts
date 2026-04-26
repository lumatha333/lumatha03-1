import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { firstName, city } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cityContext = city ? ` They are from ${city}.` : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You write warm, friendly welcome messages. Keep it to ONE sentence, max 18 words. No quotes around the message. Be genuine and personal."
          },
          {
            role: "user",
            content: `Write ONE warm welcome sentence for a new Lumatha social app user named ${firstName || "friend"}.${cityContext} Make it feel personal and exciting.`
          }
        ],
        max_tokens: 80,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ message: `Welcome to Lumatha, ${firstName || "friend"}! Your journey starts now.` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ message: `Welcome to Lumatha, ${firstName || "friend"}! Great things await you.` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ message: `Welcome to Lumatha, ${firstName || "friend"}! We're glad you're here.` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content?.trim() || `Welcome to Lumatha, ${firstName || "friend"}!`;

    return new Response(JSON.stringify({ message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("welcome-message error:", e);
    return new Response(JSON.stringify({ message: "Welcome to Lumatha! Your adventure begins now." }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
