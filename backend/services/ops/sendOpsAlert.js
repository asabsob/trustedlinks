import { sendEmail } from "../email/sendEmail.js";

export async function sendOpsAlert({
  subject,
  severity = "warning",
  message,
  meta = {},
}) {
  try {
    const html = `
      <h2>TrustedLinks AI Operations Alert</h2>

      <p><strong>Severity:</strong> ${severity}</p>

      <p><strong>Message:</strong></p>
      <pre>${message}</pre>

      <p><strong>Meta:</strong></p>
      <pre>${JSON.stringify(meta, null, 2)}</pre>
    `;

    await sendEmail({
      to: process.env.OPS_ALERT_EMAIL,
      subject: `[TrustedLinks Ops] ${subject}`,
      html,
    });

    return { ok: true };
  } catch (error) {
    console.error("OPS_ALERT_EMAIL_FAILED", error);

    return {
      ok: false,
      error: error.message,
    };
  }
}
