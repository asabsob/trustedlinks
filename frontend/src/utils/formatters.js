export function formatMoney(value, currency = "JOD") {
  return `${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}
