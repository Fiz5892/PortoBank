// Extract structured CV data from a PDF using Lovable AI Gateway.
// Receives base64-encoded PDF bytes; returns JSON: { full_name, bio, skills[], experience[], projects[] }.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.104.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.0";

const SCHEMA_TOOL = {
  type: "function",
  function: {
    name: "extract_cv",
    description: "Extract structured information from a CV / résumé.",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string", description: "Full name of the person" },
        bio: {
          type: "string",
          description: "A 2-sentence professional summary written in the third person.",
        },
        skills: {
          type: "array",
          items: { type: "string" },
          description: "Concise list of professional skills (max 20).",
        },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              company: { type: "string" },
              duration: { type: "string" },
            },
            required: ["title", "company", "duration"],
            additionalProperties: false,
          },
        },
        projects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "description"],
            additionalProperties: false,
          },
        },
      },
      required: ["full_name", "bio", "skills", "experience", "projects"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const pdfBase64: string | undefined = body?.pdfBase64;
    if (!pdfBase64 || typeof pdfBase64 !== "string" || pdfBase64.length < 100) {
      return new Response(JSON.stringify({ error: "Invalid or missing PDF data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ~5MB base64 ≈ 6.7M chars; cap a bit higher to allow padding
    if (pdfBase64.length > 7_500_000) {
      return new Response(JSON.stringify({ error: "PDF is too large (max 5 MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Use Gemini (multimodal — accepts PDFs natively as inline_data)
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You extract structured information from a CV / résumé. " +
              "Always call the `extract_cv` function with the data. Never reply in plain text. " +
              "If a field is unknown, use a sensible empty value (empty string or empty array).",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Extract structured data from this CV. " +
                  "Bio must be exactly 2 sentences. Limit skills to 20.",
              },
              {
                type: "file",
                file: {
                  filename: "cv.pdf",
                  file_data: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
        tools: [SCHEMA_TOOL],
        tool_choice: { type: "function", function: { name: "extract_cv" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({
          error:
            "AI credits exhausted. Add credits in Settings → Workspace → Usage and try again.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, text);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const argsRaw: string | undefined = toolCall?.function?.arguments;
    if (!argsRaw) {
      console.error("No tool call returned:", JSON.stringify(aiJson));
      return new Response(JSON.stringify({ error: "Could not parse CV. Try a clearer PDF." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(argsRaw);
    } catch {
      return new Response(JSON.stringify({ error: "Could not parse extracted data." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Defensive defaults
    const result = {
      full_name: typeof parsed.full_name === "string" ? parsed.full_name : "",
      bio: typeof parsed.bio === "string" ? parsed.bio : "",
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s) => typeof s === "string").slice(0, 20)
        : [],
      experience: Array.isArray(parsed.experience) ? parsed.experience.slice(0, 20) : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects.slice(0, 20) : [],
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-cv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
