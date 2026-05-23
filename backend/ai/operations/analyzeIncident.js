import { systemMap } from "../../config/systemMap.js";

export function analyzeIncident(incident) {
  const source = incident?.source;

  const service = systemMap.services[source];

  if (!service) {
    return {
      summary: "Unknown service",
      recommendations: [],
    };
  }

  return {
    summary: `${service.name} may be degraded`,

    dependencies: service.dependsOn || [],

    recommendations: [
      "Inspect recent deployments",
      "Check dependent services",
      "Review logs",
    ],
  };
}
