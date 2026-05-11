import jwt from "jsonwebtoken";

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

// General auth
export function requireAuth(req, res, next) {
  try {
    const token = readBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    req.userId = decoded.id;
    req.user = decoded;

    next();
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Business user auth
export function requireUser(req, res, next) {
  try {
    const token = readBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // يسمح للمستخدم العادي فقط
    if (decoded.role && decoded.role !== "user") {
      return res.status(403).json({ error: "Not allowed" });
    }

    req.userId = decoded.id;
    req.user = decoded;

    next();
  } catch (e) {
    console.error("USER AUTH ERROR:", e);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Campaign manager auth
export function requireCampaignManager(req, res, next) {
  try {
    const token = readBearerToken(req);

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded?.role !== "campaign_manager" || !decoded?.ownerId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    req.campaignOwner = decoded;
    next();
  } catch (e) {
    console.error("CAMPAIGN AUTH ERROR:", e);
    return res.status(401).json({ error: "Invalid token" });
  }
}
