import OpenAI from "openai";

const apiKey = String(process.env.OPENAI_API_KEY || "").trim();

let openai = null;

if (apiKey) {
  openai = new OpenAI({ apiKey });
} else {
  console.error("OPENAI_API_KEY is missing");
}

export async function parseSearchIntent(text) {
  try {
    if (!openai) {
      return {
        intent: "search",
        category: text,
        location: null,
        raw_query: text,
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You extract business-search intent from user messages.
Return valid JSON only with these fields:
intent: search | nearby | help | unknown
category: string
location: string or null
raw_query: string
`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (err) {
    console.error("AI PARSE ERROR:", err);
    return {
      intent: "search",
      category: text,
      location: null,
      raw_query: text,
    };
  }
}
