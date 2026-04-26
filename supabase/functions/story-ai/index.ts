import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, action, location, moods, title, existingContent, rank, points, challenges } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Return defaults if no API key
      if (type === "suggestions") {
        return new Response(
          JSON.stringify({ 
            suggestions: [
              "My first trek to Annapurna Base Camp",
              "3 days in Pokhara on a budget", 
              "Why Lumbini changed how I think"
            ]
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI not available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";
    const requestType = type || action;

    switch (requestType) {
      case "rank_insight":
        systemPrompt = "You are a motivational adventure guide. Be encouraging and specific.";
        userPrompt = `Give ONE specific motivating tip for someone ranked #${rank || 1} with ${points || 0} points in an adventure app. They've completed ${challenges || 0} challenges. Max 2 sentences. Be specific not generic. Nepal/travel context.`;
        break;

      case "marketplace_desc":
        systemPrompt = "You are a marketplace listing expert. Write compelling, honest product descriptions for Nepal buyers.";
        userPrompt = `Write a compelling marketplace listing description for:
Title: ${title || "Item"}
Category: ${body.category || "General"}
Condition: ${body.condition || "Not specified"}
Price: NPR ${body.price || "Not set"}
Location: ${location || "Nepal"}
2-3 sentences. Be specific and helpful for the buyer. Nepal context.`;
        break;

      case "suggestions":
        systemPrompt = "You are a travel writer helping suggest story ideas. Be inspiring and specific.";
        userPrompt = `Give 3 travel story title ideas for someone from Nepal. Mix local and international destinations. Format: Return ONLY the 3 titles, one per line, no numbers or bullets. Examples: "My first trek to Annapurna Base Camp", "3 days in Pokhara on a budget", "Why Lumbini changed how I think"`;
        break;

      case "write":
        systemPrompt = "You are an inspiring travel writer. Write vivid, personal travel stories in first person. Sound like a real traveler sharing their experience, not a brochure. Add sensory details.";
        userPrompt = `Write an inspiring travel story about visiting ${location || "a beautiful destination"}.
${moods && moods.length > 0 ? `Mood/vibe: ${moods.join(", ")}` : ""}
${title ? `Title: ${title}` : ""}
Write in first person, warm conversational tone. 3 paragraphs, around 200 words.
Nepal/South Asia context preferred. Include what you saw, felt, and one surprising detail.`;
        break;

      case "improve":
        systemPrompt = "You are an editor helping improve travel writing. Make it more vivid and engaging while keeping the author's voice.";
        userPrompt = `Improve this travel story. Make it more vivid with sensory details, but keep the original meaning and tone:

${existingContent}

Return only the improved text, nothing else.`;
        break;

      case "expand":
        systemPrompt = "You are a travel writer. Add rich sensory details and expand the narrative.";
        userPrompt = `Expand this travel story with more details. Add sensory descriptions of sights, sounds, smells. Double the length:

${existingContent}

Return only the expanded text.`;
        break;

      case "shorten":
        systemPrompt = "You are an editor. Condense while keeping the emotional core.";
        userPrompt = `Shorten this travel story to its key emotional moments. Keep it powerful but half the length:

${existingContent}

Return only the shortened text.`;
        break;

      case "nepal_flavor":
        systemPrompt = "You are a Nepali travel writer. Add cultural authenticity.";
        userPrompt = `Add Nepal cultural flavor to this story. Include Nepali words where natural (with meanings), cultural references, and local details:

${existingContent}

Return only the enhanced text.`;
        break;

      case "share_caption":
        systemPrompt = "You are a social media expert. Write engaging captions.";
        userPrompt = `Write a short, engaging share caption for this travel story. Include 2-3 relevant emojis. Max 150 characters:

Title: ${title}
Location: ${location}

Return only the caption.`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Unknown type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
          { role: "user", content: userPrompt }
        ],
        max_tokens: type === "write" || type === "expand" ? 500 : 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse response based on type
    if (type === "suggestions") {
      const suggestions = content.split("\n").filter((line: string) => line.trim().length > 0).slice(0, 3);
      return new Response(
        JSON.stringify({ suggestions }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
