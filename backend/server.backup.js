import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";
import crypto from "crypto";

/* -------------------------------------------------------------------------- */
/*                                BASIC SETUP                                 */
/* -------------------------------------------------------------------------- */
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "data.json");

function load() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ users: [], businesses: [] }, null, 2)
    );
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  console.log(`💾 Data saved successfully to ${DB_FILE}`);
}

/* -------------------------------------------------------------------------- */
/*                         📱 WHATSAPP CHECK (Mock)                           */
/* -------------------------------------------------------------------------- */
app.post("/api/check-whatsapp", async (req, res) => {
  const { whatsapp } = req.body;
  if (!whatsapp) return res.status(400).json({ error: "Number required" });
  const verified =
    whatsapp.startsWith("+96279") || whatsapp.startsWith("+9665");
  res.json({ verified });
});

/* -------------------------------------------------------------------------- */
/*                        📧 EMAIL VERIFICATION SETUP                         */
/* -------------------------------------------------------------------------- */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mskgroup@gmail.com",
    pass: "ryokhzrbsbfgzovy",
  },
});

function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5175"}/api/verify/${token}`;
  const mailOptions = {
    from: '"Trusted Links" <mskgroup@gmail.com>',
    to: email,
    subject: "Verify your email address",
    html: `
      <h2>Welcome to Trusted Links</h2>
      <p>Click below to verify your email address:</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#22c55e;color:#fff;border-radius:6px;text-decoration:none;">
        Verify My Email
      </a>
    `,
  };
  return transporter.sendMail(mailOptions);
}

/* -------------------------------------------------------------------------- */
/*                              AUTH MIDDLEWARE                               */
/* -------------------------------------------------------------------------- */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  const db = load();
  const user = db.users.find((u) => u.token === token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  req.user = user;
  req.db = db;
  next();
}

/* -------------------------------------------------------------------------- */
/*                                AUTH ROUTES                                 */
/* -------------------------------------------------------------------------- */
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required." });

  const db = load();
  if (db.users.find((u) => u.email === email))
    return res.status(400).json({ error: "Email already registered." });

  const id = nanoid(8);
  const token = nanoid(16);
  const verifyToken = crypto.randomBytes(20).toString("hex");

  const newUser = {
    id,
    email,
    password,
    token,
    businessId: null,
    emailVerified: false,
    verifyToken,
  };

  db.users.push(newUser);
  save(db);

  try {
    await sendVerificationEmail(email, verifyToken);
    console.log(`📨 Verification email sent to ${email}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
  }

  res.status(201).json({ message: "Signup successful! Please verify your email." });
});

app.get("/api/verify/:token", (req, res) => {
  const db = load();
  const user = db.users.find((u) => u.verifyToken === req.params.token);
  if (!user) return res.status(400).send("Invalid or expired verification link.");
  user.emailVerified = true;
  user.verifyToken = null;
  save(db);
  res.send(`<h2>Email Verified ✅</h2><p>You can now log in.</p>`);
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const db = load();
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.emailVerified)
    return res.status(401).json({ error: "Please verify your email first." });
  res.json({ token: user.token });
});

/* -------------------------------------------------------------------------- */
/*                        BUSINESS & ANALYTICS ROUTES                         */
/* -------------------------------------------------------------------------- */
app.post("/api/register", auth, (req, res) => {
  const db = req.db;
  const f = req.body;
  console.log("📩 Incoming business registration:", f);
  const id = nanoid(8);

  const biz = {
    id,
    name: f.name_en || "New Business",
    name_ar: f.name_ar || "",
    category: f.category || "Shop",
    description: f.desc_en || "",
    description_ar: f.desc_ar || "",
    whatsapp: f.whatsapp || "",
    address: f.address_en || "",
    address_ar: f.address_ar || "",
    whatsappLink: f.whatsapp
      ? `https://wa.me/${f.whatsapp.replace(/\D/g, "")}`
      : "",
    owner: req.user.id,
    mediaLink: f.mediaLink || "",
    status: "Active",
    clicks: [],
    views: 0,
  };

  req.user.businessId = id;
  db.businesses.push(biz);
  save(db);

  console.log("✅ Business registered and saved:", biz.name);
  res.status(201).json({ ok: true, id });
});

app.get("/api/me", auth, (req, res) => {
  const db = load();
  const user = req.user;
  const business = db.businesses.find((b) => b.id === user.businessId);
  if (!business) return res.status(404).json({ error: "Business not found" });
  res.json(business);
});

app.put("/api/update-business", auth, (req, res) => {
  const db = load();
  const user = req.user;
  const business = db.businesses.find((b) => b.id === user.businessId);
  if (!business) return res.status(404).json({ error: "Business not found" });

  Object.assign(business, req.body);
  save(db);
  res.json(business);
});

app.put("/api/toggle-status", auth, (req, res) => {
  const db = load();
  const business = db.businesses.find((b) => b.id === req.user.businessId);
  if (!business) return res.status(404).json({ error: "Business not found" });
  business.status = business.status === "Suspended" ? "Active" : "Suspended";
  save(db);
  res.json({ ok: true, status: business.status });
});

app.delete("/api/delete-business", auth, (req, res) => {
  const db = load();
  const idx = db.businesses.findIndex((b) => b.owner === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "Business not found" });
  db.businesses.splice(idx, 1);
  const user = db.users.find((u) => u.id === req.user.id);
  if (user) user.businessId = null;
  save(db);
  res.json({ ok: true });
});

/* -------------------------------------------------------------------------- */
/*                               SERVER START                                 */
/* -------------------------------------------------------------------------- */
const PORT = process.env.PORT || 5175;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));
