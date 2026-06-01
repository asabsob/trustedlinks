import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("Invalid JWT_SECRET");
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Missing admin credentials");
}

function signAdminToken(email) {
  return jwt.sign(
    { email, role: "admin" },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function readBearer(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : "";
}

function requireAdmin(req, res, next) {
  try {
    const token = readBearer(req);

    if (!token) {
      return res.status(401).json({
        error: "Missing admin token",
      });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    if (payload?.role !== "admin") {
      return res.status(403).json({
        error: "Not admin",
      });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid admin token",
    });
  }
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      String(email || "").trim().toLowerCase() !==
      String(ADMIN_EMAIL).trim().toLowerCase()
    ) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const passOk = ADMIN_PASSWORD.startsWith("$2")
      ? await bcrypt.compare(String(password), ADMIN_PASSWORD)
      : String(password) === String(ADMIN_PASSWORD);

    if (!passOk) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const token = signAdminToken(email);

    return res.json({
      ok: true,
      token,
    });

  } catch (e) {
    console.error("admin login error:", e);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.get("/me", requireAdmin, async (req, res) => {
  return res.json({
    ok: true,
    email: req.admin.email,
    role: "admin",
  });
});

export { requireAdmin };
export default router;
