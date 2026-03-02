import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useLang } from "../context/LangContext.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5175";

export default function BusinessDetails() {
  const { id } = useParams();
  const { lang } = useLang();
  const isAr = lang === "ar";
  const t = (en, ar) => (isAr ? ar : en);

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Instagram extras (optional)
  const [instaProfilePic, setInstaProfilePic] = useState(null);

  // ---------------------------- Tracking helpers ----------------------------
  const trackView = async () => {
    try {
      await fetch(`${API_BASE}/api/track-view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id }),
      });
    } catch {}
  };

  const trackClick = async (kind) => {
    try {
      await fetch(`${API_BASE}/api/track-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id, kind }),
      });
    } catch {}
  };

  const trackMedia = async () => {
    try {
      await fetch(`${API_BASE}/api/track-media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id }),
      });
    } catch {}
  };

  // ---------------------------- Load business info ----------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadBusiness() {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/business/${id}`);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
          if (!cancelled) setBusiness(null);
          return;
        }

        if (cancelled) return;
        setBusiness(data);

        // Track view AFTER successful load
        trackView();
      } catch {
        if (!cancelled) setBusiness(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBusiness();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // ---------------------------- Instagram profile image (optional) ----------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchProfilePic() {
      if (!business?.mediaLink) return;

      const link = business.mediaLink;
      const isInsta = link.includes("instagram.com");
      const isPost = /instagram\.com\/(p|reel|tv)\//.test(link);

      if (!isInsta || isPost) return;

      try {
        const username = link.split("instagram.com/")[1]?.split("/")[0]?.trim();
        if (!username) return;

        const res = await fetch(`${API_BASE}/api/instagram-profile/${username}`);
        const data = await res.json().catch(() => null);

        if (!cancelled && data?.profilePic) setInstaProfilePic(data.profilePic);
      } catch {}
    }

    fetchProfilePic();
    return () => {
      cancelled = true;
    };
  }, [business]);

  if (loading) return <p style={{ textAlign: "center" }}>{t("Loading...", "جارٍ التحميل...")}</p>;
  if (!business) return <p style={{ textAlign: "center" }}>{t("Business not found.", "لم يتم العثور على النشاط.")}</p>;

  const media = business.mediaLink || "";
  const isYouTube = media.includes("youtube.com/watch");
  const isMp4 = /\.mp4(\?.*)?$/i.test(media);
  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(media);
  const isInstagram = /instagram\.com/i.test(media);
  const isInstagramPost = /instagram\.com\/(p|reel|tv)\//i.test(media);

  const youtubeEmbed = isYouTube ? media.replace("watch?v=", "embed/") : null;

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: lang === "ar" ? "Tajawal, Inter, sans-serif" : "Inter, sans-serif",
        direction: isAr ? "rtl" : "ltr",
        textAlign: isAr ? "right" : "left",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          background: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {/* 🎬 Media Section */}
        {media ? (
          isYouTube ? (
            <iframe
              width="100%"
              height="360"
              src={youtubeEmbed}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={trackMedia}
            />
          ) : isMp4 ? (
            <video
              src={media}
              controls
              style={{ width: "100%", height: "360px", objectFit: "cover" }}
              onPlay={trackMedia}
            />
          ) : isInstagram ? (
            // ✅ Production-safe: no direct Graph oEmbed from frontend
            isInstagramPost ? (
              <a
                href={media}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackMedia}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "360px",
                  background: "#f3f4f6",
                  color: "#22c55e",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                {t("View on Instagram", "عرض على إنستغرام")}
              </a>
            ) : (
              <div
                style={{
                  height: "360px",
                  background: "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <img
                  src={
                    instaProfilePic ||
                    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png"
                  }
                  alt="Instagram Profile"
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                  }}
                />
                <a
                  href={media}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackMedia}
                  style={{
                    color: "#22c55e",
                    fontSize: "15px",
                    textDecoration: "underline",
                    fontWeight: "600",
                  }}
                >
                  {t("View Instagram Profile", "عرض ملف إنستغرام")}
                </a>
              </div>
            )
          ) : isImage ? (
            <img
              src={media}
              alt={business.name}
              style={{ width: "100%", height: "360px", objectFit: "cover" }}
              onClick={trackMedia}
            />
          ) : (
            <a
              href={media}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackMedia}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "360px",
                background: "#f3f4f6",
                color: "#22c55e",
                fontWeight: 600,
                textDecoration: "underline",
              }}
            >
              {t("Open media", "فتح الوسائط")}
            </a>
          )
        ) : (
          <div
            style={{
              height: "300px",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
              fontSize: "14px",
            }}
          >
            {t("No image or video", "لا يوجد صورة أو فيديو")}
          </div>
        )}

        {/* 🧾 Business Info */}
        <div style={{ padding: "24px" }}>
          <h2 style={{ marginBottom: "10px" }}>{business.name}</h2>

          <div
            style={{
              background: "#22c55e",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              display: "inline-block",
              marginBottom: "16px",
            }}
          >
            {business.category || t("Uncategorized", "غير مصنّف")}
          </div>

          {/* 🏠 Address Section */}
          <div style={{ color: "#777", fontSize: "14px", marginBottom: "12px" }}>
            📍 <strong>{t("Address:", "العنوان:")}</strong>{" "}
            {business.mapLink ? (
              <a
                href={business.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick("map")}
                style={{
                  color: "#22c55e",
                  fontWeight: 600,
                  textDecoration: "underline",
                  marginInlineStart: "6px",
                }}
              >
                {t("Open in Maps", "فتح على الخريطة")}
              </a>
            ) : (
              t("Not specified", "غير محدد")
            )}
          </div>

          {/* 💬 Status */}
          <p style={{ color: "#777", fontSize: "14px" }}>
            💬 <strong>{t("Status:", "الحالة:")}</strong> {business.status || t("Active", "نشط")}
          </p>

          {/* ✅ Action Buttons */}
          <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
            {(business.whatsappLink || business.whatsapp) && (
              <a
                href={
                  business.whatsappLink ||
                  `https://wa.me/${(business.whatsapp || "").toString().replace(/\D/g, "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick("whatsapp")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#22c55e",
                  color: "white",
                  borderRadius: "8px",
                  padding: "12px 0",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                💬 {t("Chat on WhatsApp", "تواصل عبر واتساب")}
              </a>
            )}

            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick("website")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#f3f4f6",
                  color: "#333",
                  borderRadius: "8px",
                  padding: "12px 0",
                  textDecoration: "none",
                  fontWeight: "600",
                }}
              >
                🌐 {t("Visit Website", "زيارة الموقع")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
