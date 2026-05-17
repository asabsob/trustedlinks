// ============================================================================
// TrustedLinks AI Gateway
// ============================================================================

import OpenAI from "openai";

import { sanitizeAIInput } from "./sanitizeInput.js";
import { logAIEvent } from "./aiAuditLogger.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runSafeAI({
  role = "merchant",
  task = "",
  input = {},
  language = "ar",
}) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing");
    }

    const sanitizedInput = sanitizeAIInput(input);

    const systemPrompt = `
You are TrustedLinks AI Assistant.

Rules:
- You are READ ONLY.
- Never expose secrets.
- Never expose phone numbers.
- Never expose emails.
- Never expose raw logs.
- Never reveal tokens or credentials.
- Never execute actions.
- Never modify data.
- Give short practical recommendations.
- Explain KPIs clearly.
- Be privacy-first.
- Be safe for production systems.

User Role: ${role}
Language: ${language === "ar" ? "Arabic" : "English"}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            task,
            input: sanitizedInput,
          }),
        },
      ],

      temperature: 0.3,
    });

    const result =
      response?.choices?.[0]?.message?.content || "";

    await logAIEvent({
      type: "assistant_request",
      role,
      action: task,
      status: "success",
    });

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error("AI_GATEWAY_ERROR", error);

    await logAIEvent({
      type: "assistant_request",
      role,
      action: task,
      status: "failed",
      meta: {
        error: error.message,
      },
    });

    return {
      success: false,
      error: error.message,
    };
  }
}
