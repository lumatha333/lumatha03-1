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
    const { placeName, country } = await req.json();
    
    if (!placeName || !country) {
      return new Response(
        JSON.stringify({ error: "Missing placeName or country" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Return a default description if no API key
      const defaultDesc = `${placeName} is a remarkable destination in ${country}. This place offers visitors a unique experience with its distinctive character and atmosphere. Best visited during favorable weather conditions.`;
      return new Response(
        JSON.stringify({ description: defaultDesc }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          {
            role: "system",
            content: "You are a travel writer. Write captivating, inspiring place descriptions. Be concise but evocative."
          },
          {
            role: "user",
            content: `Write a captivating 3-sentence description of ${placeName} in ${country}. Include: what makes it special, best time to visit, and one surprising fact. Be inspiring, not Wikipedia-dry. Keep it under 80 words.`
          }
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", description: `${placeName} in ${country} is a must-visit destination for travelers seeking authentic experiences.` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || 
      `${placeName} is a remarkable destination in ${country} that captivates visitors with its unique charm.`;

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        description: "This remarkable destination offers visitors a unique experience. Explore its beauty and discover what makes it special."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
