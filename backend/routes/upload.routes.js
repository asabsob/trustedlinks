import express from "express";
import multer from "multer";
import supabase from "../db/postgres.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/logo",
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Logo file is required",
        });
      }

      const file = req.file;

      const ext =
        file.originalname.split(".").pop() || "jpg";

      const fileName =
        `logos/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

      const { error: uploadError } = await supabase
        .storage
        .from("business-media")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("business-media")
        .getPublicUrl(fileName);

      return res.json({
        success: true,
        logoUrl: data.publicUrl,
      });

    } catch (err) {
      console.error("LOGO_UPLOAD_ERROR", err);

      return res.status(500).json({
        error: "Failed to upload logo",
      });
    }
  }
);

export default router;
