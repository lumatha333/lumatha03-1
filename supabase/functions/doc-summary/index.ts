import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, docTitle, docDescription, question } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let prompt = "";

    if (action === "summarize") {
      prompt = `You are a document summarizer for students. Summarize a document titled "${docTitle}"${docDescription ? ` with description: "${docDescription}"` : ""}.

Give a structured summary in this exact format:

📄 ABOUT: [One clear sentence about what this document is about]

🔑 KEY POINTS:
• [Point 1]
• [Point 2]
• [Point 3]
• [Point 4 if relevant]
• [Point 5 if relevant]

💡 MAIN TAKEAWAY: [One sentence - the most important thing to remember]

Keep it simple, clear, and helpful for students. Use plain language.`;
    } else if (action === "ask") {
      prompt = `You are a helpful study assistant. A student has a document titled "${docTitle}"${docDescription ? ` (description: "${docDescription}")` : ""}.

They are asking: "${question}"

Give a clear, concise answer based on what you can infer about this document from its title and description. If you cannot answer accurately, say so honestly and suggest what the student should look for in the document. Keep the answer under 200 words.`;
    } else if (action === "auto-title") {
      prompt = `Suggest a clear, descriptive title for a document with filename: "${docTitle}". Return ONLY the suggested title, nothing else. Keep it under 60 characters.`;
    } else {
      throw new Error("Invalid action");
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
          { role: "system", content: "You are a helpful educational assistant focused on helping students understand documents." },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
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
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("doc-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
