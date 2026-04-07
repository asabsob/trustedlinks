import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const text = res.choices?.[0]?.message?.content || "{}";

    const parsed = JSON.parse(text);

    return parsed;
  } catch (e) {
    console.error("translation error:", e);
    return null;
  }
}
