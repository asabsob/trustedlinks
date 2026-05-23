export function generateRecoveryPlan(incident) {
  const source = incident?.source;

  if (source === "search") {
    return {
      priority: "medium",

      actions: [
        "Inspect Supabase latency",
        "Review recent search deployments",
        "Check nearby search queries",
        "Restart backend workers if latency persists",
      ],
    };
  }

  if (source === "whatsapp") {
    return {
      priority: "high",

      actions: [
        "Check JAVNA API status",
        "Inspect rate limits",
        "Retry failed templates",
        "Temporarily reduce outbound volume",
      ],
    };
  }

  if (source === "billing") {
    return {
      priority: "critical",

      actions: [
        "Inspect wallet transaction logs",
        "Check duplicate charge locks",
        "Verify Supabase transaction integrity",
      ],
    };
  }

  return {
    priority: "low",

    actions: [
      "Inspect logs",
      "Review recent deployments",
    ],
  };
}
