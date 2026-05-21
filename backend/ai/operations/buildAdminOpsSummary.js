import { runSafeAI } from "../gateway/aiGateway.js";

export async function buildAdminOpsSummary({
  alerts = [],
  stats = {},
  language = "ar",
}) {
  return runSafeAI({
    role: "admin",
    language,
    task: `
Act as TrustedLinks AI Operations Analyst.

Rules:
- Read-only analysis only.
- Do not suggest direct database changes.
- Do not expose private user data.
- Explain system health in operational terms.
- Focus on TrustedLinks platform only.

Summarize:
- System health
- Critical risks
- Wallet risks
- WhatsApp/webhook risks
- AI assistant risks
- Recommended next operational checks

Keep it short and practical.
`,
    input: {
      alerts,
      stats,
    },
  });
}
