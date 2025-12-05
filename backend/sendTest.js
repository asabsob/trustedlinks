import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mskgroup@gmail.com",
    pass: "YOUR_APP_PASSWORD", // the 16-char app password
  },
});

const info = await transporter.sendMail({
  from: '"Trusted Links" <mskgroup@gmail.com>',
  to: "admin@wifaqemd.com",
  subject: "Test Email from Trusted Links",
  text: "If you receive this, Gmail SMTP works!",
});

console.log("✅ Email sent:", info.messageId);
