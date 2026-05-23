import { systemMap } from "../../config/systemMap.js";

export function generateIncidentDiagnosis(incident) {
  const source = incident?.source;

  const service = systemMap.services[source];

  if (!service) {
    return {
      summary: "Unknown incident source",
      possibleCauses: [],
      recommendations: [],
    };
  }

  let possibleCauses = [];

  if (source === "search") {
    possibleCauses = [
      "Supabase latency",
      "Large search payload",
      "Nearby search overload",
      "Slow AI parser",
    ];
  }

  if (source === "whatsapp") {
    possibleCauses = [
      "JAVNA API instability",
      "Rate limiting",
      "Template rejection",
    ];
  }

  if (source === "billing") {
    possibleCauses = [
      "Wallet transaction conflict",
      "Insufficient balance",
      "Supabase transaction delay",
    ];
  }

  return {
    summary: `${service.name} incident detected`,

    dependencies: service.dependsOn || [],

    possibleCauses,

    recommendations: [
      "Inspect recent logs",
      "Check dependent services",
      "Inspect deployment changes",
    ],
  };
}
