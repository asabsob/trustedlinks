import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mskgroup@gmail.com",
    pass: "lpohagvpjbiuwyml", // example: lpohagvpjbiuwyml
  },
});

const mailOptions = {
  from: '"Trusted Links" <mskgroup@gmail.com>',
  to: "YOUR_PERSONAL_EMAIL@gmail.com",
  subject: "Test Email from Trusted Links",
  text: "✅ This is a test email sent directly via Nodemailer.",
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log("📨 Email sent successfully:", info.response);
} catch (err) {
  console.error("❌ Failed to send email:", err.message);
}
