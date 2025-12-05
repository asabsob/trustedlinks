// ============================================================================
// Trusted Links - Auth Routes
// Handles user authentication, forgot/reset password, and WhatsApp OTP mock
// ============================================================================

import express from "express";
import fs from "fs";
import bcrypt from "bcrypt";

const router = express.Router();
const USERS_FILE = "./data.json";

/* ------------------ Utility: Load & Save Database ------------------ */
function loadUsers() {
  const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  // ✅ Ensure data.users exists and is an array
  return data.users || [];
}

function saveUsers(usersArray) {
  const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  data.users = usersArray;
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

/* ------------------ Mock WhatsApp OTP Sender ------------------ */
async function sendOTP(whatsapp, otp) {
  console.log(`📱 Sending OTP ${otp} to ${whatsapp}`);
  // TODO: later connect your WhatsApp Cloud API or Twilio WhatsApp here
}

/* --------------------- Step 1: Forgot Password --------------------- */
router.post("/forgot-password", async (req, res) => {
  const { email, whatsapp } = req.body;
  const users = loadUsers();

  const user = users.find(
    (u) => u.email === email || (whatsapp && u.whatsapp === whatsapp)
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  user.resetOtp = otp;
  user.resetExpires = otpExpires;

  saveUsers(users);
  await sendOTP(user.whatsapp || "N/A", otp);

  res.json({ message: "✅ OTP sent successfully" });
});

/* --------------------- Step 2: Reset Password --------------------- */
router.post("/reset-password", async (req, res) => {
  const { email, whatsapp, otp, newPassword } = req.body;
  const users = loadUsers();

  const user = users.find(
    (u) =>
      (u.email === email || (whatsapp && u.whatsapp === whatsapp)) &&
      u.resetOtp === otp &&
      u.resetExpires > Date.now()
  );

  if (!user) return res.status(400).json({ error: "Invalid or expired OTP" });

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  delete user.resetOtp;
  delete user.resetExpires;

  saveUsers(users);
  res.json({ message: "✅ Password reset successful" });
});

export default router;
