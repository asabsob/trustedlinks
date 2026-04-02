import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

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
