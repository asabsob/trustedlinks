import express from "express";
import { getBusinessByCustomId } from "../services/pg/businesses.js";

const router = express.Router();

router.get("/logo/:customId", async (req, res) => {
  try {
    const customId = String(
      req.params.customId || ""
    ).trim();

    if (!customId) {
      return res.status(400).send("Missing customId");
    }

    const business =
      await getBusinessByCustomId(customId);

    if (!business?.logo) {
      return res.status(404).send("Logo not found");
    }

    res.setHeader(
      "Cache-Control",
      "public, max-age=86400"
    );

    return res.redirect(302, business.logo);

  } catch (err) {
    console.error(
      "MEDIA_LOGO_ERROR",
      err
    );

    return res.status(500).send("Logo error");
  }
});

export default router;
