import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, name, streak, done, total, category, action, noteText, noteTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let prompt = "";

    if (type === "morning") {
      prompt = `Write a 2 sentence motivational message for ${name || "a user"} who has a ${streak || 0} day streak and completed ${done || 0}/${total || 0} tasks. Be specific, warm, and encouraging. Nepal context. No emojis in the text.`;
    } else if (type === "suggest") {
      prompt = `Suggest exactly 3 actionable tasks for the "${category || "daily"}" category of a personal todo list. Each task should be specific, achievable, and helpful. Return ONLY a JSON array of 3 strings, nothing else. Example: ["Task 1", "Task 2", "Task 3"]`;
    } else if (type === "note-ai") {
      const actions: Record<string, string> = {
        continue: `Continue writing this note titled "${noteTitle}". Here's what's written so far: "${noteText}". Write 2-3 more sentences that naturally continue the content.`,
        summarize: `Summarize this note titled "${noteTitle}" in 2-3 concise bullet points: "${noteText}"`,
        improve: `Improve the writing quality of this text while keeping the same meaning. Make it clearer and more engaging: "${noteText}"`,
        translate: `Translate this text to Nepali: "${noteText}"`,
      };
      prompt = actions[action] || "Invalid action";
    } else {
      throw new Error("Invalid type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a helpful productivity assistant. Keep responses concise." },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    if (type === "suggest") {
      try {
        const jsonMatch = reply.match(/\[[\s\S]*\]/);
        const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        return new Response(JSON.stringify({ suggestions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ suggestions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (type === "note-ai") {
      return new Response(JSON.stringify({ result: reply }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("todo-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
