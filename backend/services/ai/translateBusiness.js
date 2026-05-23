import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeParseAIJson(text = "") {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in AI response");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function translateBusinessContent({
  description = "",
  keywords = [],
  sourceLang = "en",
}) {
  try {
    const prompt = `
You are a professional business content translator.

Task:
Translate and optimize business content between English and Arabic.

Rules:
- Keep it natural, not literal
- Keep marketing tone
- Keep keywords relevant for search
- Do NOT translate brand names
- Return valid JSON only
- Do not wrap JSON in markdown

Input:
Description: ${description}
Keywords: ${keywords.join(", ")}
Source Language: ${sourceLang}

Return JSON:
{
  "description_en": "...",
  "description_ar": "...",
  "keywords_en": ["..."],
  "keywords_ar": ["..."]
}
`;

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices?.[0]?.message?.content || "{}";
    return safeParseAIJson(text);
  } catch (e) {
    console.error("translation error:", e);
    return null;
  }
}
