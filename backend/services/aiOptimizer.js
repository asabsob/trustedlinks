import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildPrompt({
  businessName = "",
  businessNameAr = "",
  category = "",
  description = "",
  keywords = [],
  topSearchKeywords = [],
  lowConversionKeywords = [],
  locationText = "",
  countryName = "",
  lang = "en",
  correctionNotes = "",
}) {
  return `
You are an expert business listing optimizer for a WhatsApp business discovery platform.

Your task:
Improve this business profile so it gets more discovery and more clicks/messages.

Business data:
- Business name (EN): ${businessName}
- Business name (AR): ${businessNameAr}
- Category: ${category}
- Current description: ${description}
- Existing keywords: ${safeArray(keywords).join(", ")}
- Top search keywords from analytics: ${safeArray(topSearchKeywords).join(", ")}
- Low conversion keywords: ${safeArray(lowConversionKeywords).join(", ")}
- Location: ${locationText}
- Country: ${countryName}
- Output language: ${lang}
- User correction notes: ${correctionNotes}

Strict rules:
1. Do NOT invent facts.
2. Do NOT mention products/services unless strongly supported by the business name, current description, category, keywords, or correction notes.
3. If user correction notes say something is wrong, correct it and avoid repeating it.
4. Keep suggestions practical and marketable.
5. Description should be concise and strong.
6. Suggested keywords should be highly relevant for search visibility.
7. CTA should be short and action-oriented.
8. Score should be from 0 to 100.
9. Return strict JSON only.
10. JSON keys must be exactly:
{
  "headline": string,
  "optimizedDescription": string,
  "suggestedKeywords": string[],
  "cta": string,
  "recommendations": string[],
  "score": number
}
`;
}

export async function optimizeBusinessProfile(input) {
  const prompt = buildPrompt(input);

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0.3,
    text: {
      format: {
        type: "json_schema",
        name: "business_profile_optimization",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            headline: { type: "string" },
            optimizedDescription: { type: "string" },
            suggestedKeywords: {
              type: "array",
              items: { type: "string" },
            },
            cta: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" },
            },
            score: { type: "number" },
          },
          required: [
            "headline",
            "optimizedDescription",
            "suggestedKeywords",
            "cta",
            "recommendations",
            "score",
          ],
        },
      },
    },
  });

  const text = response.output_text?.trim() || "";

  if (!text) {
    throw new Error("Empty AI response");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("AI raw output:", text);
    throw new Error("AI returned invalid JSON");
  }

  return {
    headline: String(parsed.headline || "").trim(),
    optimizedDescription: String(parsed.optimizedDescription || "").trim(),
    suggestedKeywords: safeArray(parsed.suggestedKeywords)
      .map((x) => String(x).trim())
      .filter(Boolean),
    cta: String(parsed.cta || "").trim(),
    recommendations: safeArray(parsed.recommendations)
      .map((x) => String(x).trim())
      .filter(Boolean),
    score: Number(parsed.score || 0),
  };
}
