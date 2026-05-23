export function generateDailyOpsReport({
  incidents = [],
  stats = {},
}) {
  return {
    systemHealth:
      incidents.length > 10 ? "degraded" : "healthy",

    summary: {
      incidents: incidents.length,
      searches: stats.searches || 0,
      leadClicks: stats.leadClicks || 0,
    },

    recommendations: [
      "Review slow searches",
      "Inspect WhatsApp failures",
      "Monitor low balance merchants",
    ],
  };
}
