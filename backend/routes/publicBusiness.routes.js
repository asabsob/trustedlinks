import express from "express";

import {
  listActiveBusinesses,
  getBusinessById,
  getBusinessByCustomId,
} from "../services/pg/businesses.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const list = await listActiveBusinesses();

    const formatted = list.map((b) => ({
      ...b,

      logo:
        b.logo ||
        (b.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
          String(b.mediaLink)
        )
          ? b.mediaLink
          : null),

      whatsappLink: b.whatsapp
        ? `https://wa.me/${String(b.whatsapp).replace(/\D/g, "")}`
        : null,
    }));

    return res.json({
      ok: true,
      results: formatted,
    });

  } catch (e) {
    console.error("/api/businesses error", e);

    return res.status(500).json({
      error: "Failed",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    let business = null;

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id
      );

    if (isUuid) {
      business = await getBusinessById(id);
    }

    if (!business) {
      business = await getBusinessByCustomId(id);
    }

    if (!business) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    const formatted = {
      ...business,

      logo:
        business.logo ||
        (business.mediaLink &&
        /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(
          String(business.mediaLink)
        )
          ? business.mediaLink
          : null),

      whatsappLink: business.whatsapp
        ? `https://wa.me/${String(
            business.whatsapp
          ).replace(/\D/g, "")}`
        : null,
    };

    return res.json({
      ok: true,
      business: formatted,
    });

  } catch (e) {
    console.error("/api/business/:id error", e);

    return res.status(404).json({
      error: "Not found",
    });
  }
});

export default router;
