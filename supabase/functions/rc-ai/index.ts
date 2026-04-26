import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, messages: chatMessages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt: string;
    let userPrompt: string;
    let maxTokens = 60;

    if (type === "icebreaker") {
      systemPrompt = "You generate conversation starters for two anonymous strangers connecting on a social app in Nepal. Make it fun, light, culturally relevant. Max 15 words. No greetings, no quotes. Just the question.";
      userPrompt = "Generate ONE interesting conversation starter question.";
      maxTokens = 40;
    } else if (type === "smart-reply") {
      systemPrompt = "You suggest 3 casual friendly replies for talking to an anonymous stranger. Keep it light and fun. Nepal context. Return ONLY valid JSON: {\"replies\":[\"reply1\",\"reply2\",\"reply3\"]}. Each max 5 words.";
      const lastMsg = chatMessages?.[chatMessages.length - 1]?.content || "";
      userPrompt = `Last message: "${lastMsg}"`;
      maxTokens = 80;
    } else if (type === "session-summary") {
      systemPrompt = "Summarize this anonymous conversation in ONE warm sentence. Focus on the vibe and topics discussed. Don't mention any names. Keep it under 20 words. Be warm and nostalgic. Nepal cultural context when relevant.";
      const msgTexts = (chatMessages || []).slice(-5).map((m: any) => m.content).join(" | ");
      userPrompt = `Conversation excerpts: ${msgTexts}`;
      maxTokens = 50;
    } else {
      // name generation
      systemPrompt = "Give ONE anonymous nature-inspired 2-word name. Nepal nature theme. Capitalize both words. Only output the name, nothing else.";
      userPrompt = "Generate a name.";
      maxTokens = 10;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    if (type === "smart-reply") {
      let replies: string[] = [];
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) replies = JSON.parse(jsonMatch[0]).replies || [];
      } catch { replies = ["Sounds good! 👍", "Tell me more!", "Nice 😊"]; }
      return new Response(JSON.stringify({ replies: replies.slice(0, 3) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rc-ai error:", e);
    return new Response(JSON.stringify({ result: "A warm conversation between two strangers 💜" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
