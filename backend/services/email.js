import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  text,
}) {
  return resend.emails.send({
    from:
      process.env.FROM_EMAIL ||
      "Trusted Links <no-reply@trustedlinks.net>",

    to,
    subject,
    html,
    text,
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}) {
  return transporter.sendMail({
    from:
      process.env.FROM_EMAIL ||
      process.env.SMTP_USER,

    to,
    subject,
    html,
    text,
  });
}
