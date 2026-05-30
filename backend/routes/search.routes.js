import express from "express";
import { searchBusinesses } from "../search/searchService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { query = "", lang = "ar" } = req.query;

    const searchData = await searchBusinesses({
      query: String(query || "").trim(),
      lang: String(lang || "ar").trim(),
    });

    return res.json(searchData);
  } catch (e) {
    console.error("/api/search error", e);

    return res.status(500).json({
      ok: false,
      error: "Failed to search",
    });
  }
});

export default router;
