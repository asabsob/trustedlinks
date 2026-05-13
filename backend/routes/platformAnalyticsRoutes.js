import express from "express";
import supabase from "../db/postgres.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get(
  "/search-demand",
  requireAdmin,
  async (req, res) => {
    try {
      // TOTAL SEARCHES
      const { count: totalSearches } =
        await supabase
          .from("lead_tokens")
          .select("*", {
            count: "exact",
            head: true,
          });

      // UNIQUE USERS
      const { data: uniqueUsersData } =
        await supabase
          .from("lead_clicks")
          .select("user_phone_hash");

      const uniqueUsers =
        new Set(
          (uniqueUsersData || [])
            .map((u) => u.user_phone_hash)
            .filter(Boolean)
        ).size;

      // TOP KEYWORDS
      const { data: keywords } =
        await supabase
          .from("lead_tokens")
          .select("query");

      const keywordMap = {};

      (keywords || []).forEach((k) => {
        const q = String(
          k.query || ""
        ).trim();

        if (!q) return;

        keywordMap[q] =
          (keywordMap[q] || 0) + 1;
      });

      const topKeywords =
        Object.entries(keywordMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([query, count]) => ({
            query,
            count,
          }));

      // TOP INTENTS
      const { data: intents } =
        await supabase
          .from("lead_tokens")
          .select("intent_type");

      const intentMap = {};

      (intents || []).forEach((i) => {
        const type =
          i.intent_type || "unknown";

        intentMap[type] =
          (intentMap[type] || 0) + 1;
      });

      const topIntents =
        Object.entries(intentMap).map(
          ([intent, count]) => ({
            intent,
            count,
          })
        );

      // NO RESULTS
      const { count: noResults } =
        await supabase
          .from("search_no_results")
          .select("*", {
            count: "exact",
            head: true,
          });

      // TOP BUSINESSES
      const { data: events } =
        await supabase
          .from("business_events")
          .select(`
            business_id,
            views,
            whatsapp,
            businesses (
              name,
              name_ar
            )
          `);

      const businessStats = {};

      (events || []).forEach((e) => {
        const id = e.business_id;

        if (!id) return;

        if (!businessStats[id]) {
          businessStats[id] = {
            business_id: id,
            name:
              e.businesses?.name ||
              "-",
            name_ar:
              e.businesses?.name_ar ||
              e.businesses?.name ||
              "-",
            views: 0,
            whatsapp: 0,
          };
        }

        businessStats[id].views +=
          Number(e.views || 0);

        businessStats[id].whatsapp +=
          Number(e.whatsapp || 0);
      });

      const topBusinesses =
        Object.values(businessStats)
          .sort(
            (a, b) =>
              b.views - a.views
          )
          .slice(0, 10);

      return res.json({
        ok: true,

        overview: {
          totalSearches:
            totalSearches || 0,

          uniqueUsers,

          noResults:
            noResults || 0,
        },

        topKeywords,
        topIntents,
        topBusinesses,
      });
    } catch (err) {
      console.error(
        "PLATFORM ANALYTICS ERROR:",
        err
      );

      return res.status(500).json({
        error:
          "Failed to load analytics",
      });
    }
  }
);

export default router;
