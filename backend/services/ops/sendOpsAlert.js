export async function sendOpsAlert({
  subject,
  severity = "warning",
  message,
  meta = {},
}) {
  try {
    const key = (process.env.RESEND_API_KEY || "").trim();
    const from = (process.env.MAIL_FROM || "").trim();
    const to = (process.env.OPS_ALERT_EMAIL || "").trim();

    if (!key || !from || !to) {
      console.warn("OPS_ALERT_EMAIL_SKIPPED", {
        hasKey: Boolean(key),
        hasFrom: Boolean(from),
        hasTo: Boolean(to),
      });

      return { ok: false, skipped: true };
    }

    const html = `
      <h2>TrustedLinks AI Operations Alert</h2>
      <p><strong>Severity:</strong> ${severity}</p>
      <p><strong>Message:</strong></p>
      <pre>${message}</pre>
      <p><strong>Meta:</strong></p>
      <pre>${JSON.stringify(meta, null, 2)}</pre>
    `;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[TrustedLinks Ops] ${subject}`,
        html,
      }),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      throw new Error(`Resend alert failed (${r.status}): ${JSON.stringify(data)}`);
    }

    return { ok: true };
  } catch (error) {
    console.error("OPS_ALERT_EMAIL_FAILED", error);
    return { ok: false, error: error.message };
  }
}
