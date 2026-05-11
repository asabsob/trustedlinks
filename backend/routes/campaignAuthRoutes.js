import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import supabase from "../db/postgres.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

function signCampaignToken(owner) {
  return jwt.sign(
    {
      id: owner.id,
      ownerId: owner.id,
      role: "campaign_manager",
      name: owner.name,
      email: owner.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireCampaignManager(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded?.role !== "campaign_manager" || !decoded?.ownerId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    req.campaignOwner = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      entityType = "mall",
      email,
      phone,
      username,
      password,
      country,
      city,
    } = req.body || {};

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        error: "Name, email, username, and password are required",
      });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const usernameNorm = String(username).trim().toLowerCase();

    const { data: existing, error: existingError } = await supabase
      .from("campaign_owners")
      .select("id")
      .or(`email.eq.${emailNorm},username.eq.${usernameNorm}`)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return res.status(409).json({
        error: "Email or username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .insert({
        name: String(name).trim(),
        entity_type: entityType,
        email: emailNorm,
        phone: phone || null,
        username: usernameNorm,
        password_hash: passwordHash,
        country: country || null,
        city: city || null,
        status: "active",
      })
      .select("*")
      .single();

    if (error) throw error;

    const token = signCampaignToken(owner);

    return res.status(201).json({
      ok: true,
      token,
      owner: {
        id: owner.id,
        name: owner.name,
        entityType: owner.entity_type,
        email: owner.email,
        username: owner.username,
        country: owner.country,
        city: owner.city,
        status: owner.status,
      },
    });
  } catch (err) {
    console.error("CAMPAIGN REGISTER ERROR:", err);
    return res.status(500).json({ error: "Campaign registration failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (!login || !password) {
      return res.status(400).json({
        error: "Login and password are required",
      });
    }

    const loginNorm = String(login).trim().toLowerCase();

    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .select("*")
      .or(`email.eq.${loginNorm},username.eq.${loginNorm}`)
      .maybeSingle();

    if (error) throw error;

    if (!owner) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (owner.status !== "active") {
      return res.status(403).json({ error: "Account is not active" });
    }

    const ok = await bcrypt.compare(String(password), owner.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signCampaignToken(owner);

    return res.json({
      ok: true,
      token,
      owner: {
        id: owner.id,
        name: owner.name,
        entityType: owner.entity_type,
        email: owner.email,
        username: owner.username,
        country: owner.country,
        city: owner.city,
        status: owner.status,
      },
    });
  } catch (err) {
    console.error("CAMPAIGN LOGIN ERROR:", err);
    return res.status(500).json({ error: "Campaign login failed" });
  }
});

// ME
router.get("/me", requireCampaignManager, async (req, res) => {
  try {
    const { data: owner, error } = await supabase
      .from("campaign_owners")
      .select("id, name, entity_type, email, username, phone, country, city, status, created_at")
      .eq("id", req.campaignOwner.ownerId)
      .maybeSingle();

    if (error) throw error;

    if (!owner) {
      return res.status(404).json({ error: "Campaign owner not found" });
    }

    return res.json({
      ok: true,
      owner,
    });
  } catch (err) {
    console.error("CAMPAIGN ME ERROR:", err);
    return res.status(500).json({ error: "Failed to load campaign owner" });
  }
});

export { requireCampaignManager };
export default router;
