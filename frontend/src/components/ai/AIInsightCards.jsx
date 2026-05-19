import React from "react";

export default function AIInsightCards({ insights = [], lang = "ar" }) {
  if (!Array.isArray(insights) || insights.length === 0) return null;

  return (
    <div style={wrapStyle}>
      {insights.map((item, index) => (
        <div key={index} style={cardStyle(item.type)}>
          <div style={iconStyle}>{getIcon(item.type)}</div>

          <div>
            <div style={titleStyle}>{item.title}</div>
            <div style={textStyle}>{item.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getIcon(type) {
  if (type === "warning") return "⚠️";
  if (type === "success") return "✅";
  if (type === "opportunity") return "📈";
  if (type === "wallet") return "💰";
  if (type === "visibility") return "🔍";
  return "💡";
}

const wrapStyle = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const cardStyle = (type) => ({
  display: "flex",
  gap: 12,
  background:
    type === "warning"
      ? "#fff7ed"
      : type === "success"
      ? "#f0fdf4"
      : "#ffffff",
  border:
    type === "warning"
      ? "1px solid #fed7aa"
      : type === "success"
      ? "1px solid #bbf7d0"
      : "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
});

const iconStyle = {
  fontSize: 22,
};

const titleStyle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 4,
};

const textStyle = {
  fontSize: 13,
  lineHeight: 1.6,
  color: "#4b5563",
};
