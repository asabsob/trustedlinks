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

Rules:
1. Keep suggestions practical and marketable.
2. Do not invent false claims.
3. Description should be concise and strong.
4. Suggested keywords should be highly relevant for search visibility.
5. CTA should be short and action-oriented.
6. Score should be from 0 to 100.
7. Return strict JSON only.
8. JSON keys must be:
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
    model: "gpt-5.1-mini",
    input: prompt,
    temperature: 0.4,
  });

  const text = response.output_text?.trim() || "";

  if (!text) {
    throw new Error("Empty AI response");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI returned non-JSON output");
  }

  return {
    headline: String(parsed.headline || "").trim(),
    optimizedDescription: String(parsed.optimizedDescription || "").trim(),
    suggestedKeywords: safeArray(parsed.suggestedKeywords).map((x) => String(x).trim()).filter(Boolean),
    cta: String(parsed.cta || "").trim(),
    recommendations: safeArray(parsed.recommendations).map((x) => String(x).trim()).filter(Boolean),
    score: Number(parsed.score || 0),
  };
}
