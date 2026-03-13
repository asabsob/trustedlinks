import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseSearchIntent(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are an assistant that extracts business search intent.

Return JSON only.

Fields:
intent: search | nearby | help
category: business category
location: city or area if mentioned
raw_query: cleaned search query
`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = response.choices[0].message.content;

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
