import express from "express";
import { searchBusinesses } from "../search/searchService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const started = Date.now();

  try {
    const { query = "", lang = "ar" } = req.query;

    const searchData = await searchBusinesses({
      query: String(query || "").trim(),
      lang: String(lang || "ar").trim(),
    });

    console.log("SEARCH_PERFORMANCE", {
      query,
      durationMs: Date.now() - started,
      resultCount: searchData?.results?.length || 0,
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
