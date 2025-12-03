import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function BusinessDetails() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instagramEmbed, setInstagramEmbed] = useState(null);
  const [instaProfilePic, setInstaProfilePic] = useState(null);

  // ✅ Track clicks or views
  const trackAction = async (type) => {
    try {
      const endpoint =
        type === "media"
          ? "http://localhost:5175/api/track-media"
          : "http://localhost:5175/api/track-click";

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id }),
      });
    } catch (err) {
      console.error(`Failed to track ${type}:`, err);
    }
  };

  // 🔹 Load business info
  useEffect(() => {
    async function loadBusiness() {
      try {
        // ✅ Corrected endpoint: /api/business/:id (singular)
        const res = await fetch(`http://localhost:5175/api/business/${id}`);

        if (!res.ok) {
          console.error(`HTTP ${res.status} on /api/business/${id}`);
          setBusiness(null);
          return;
        }

        // ✅ Safe JSON parsing
        const text = await res.text();
        const data = JSON.parse(text);

        setBusiness(data);

        // ✅ Track view
        await fetch("http://localhost:5175/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: id }),
        });
      } catch (err) {
        console.error("Error loading business:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [id]);

  // 🔹 Instagram embed fetch
  useEffect(() => {
    async function fetchInstagramEmbed() {
      if (business?.mediaLink?.includes("instagram.com")) {
        try {
          const embedUrl = `https://graph.facebook.com/v17.0/instagram_oembed?url=${encodeURIComponent(
            business.mediaLink
          )}&omitscript=false`;
          const response = await fetch(embedUrl);
          const data = await response.json();
          setInstagramEmbed(data.html || null);

          const script = document.createElement("script");
          script.async = true;
          script.src = "//www.instagram.com/embed.js";
          document.body.appendChild(script);
        } catch (error) {
          console.warn("Instagram embed fetch failed:", error);
          setInstagramEmbed(null);
        }
      }
    }

    fetchInstagramEmbed();
  }, [business]);

  // 🔹 Instagram profile image
  useEffect(() => {
    async function fetchProfilePic() {
      if (
        business?.mediaLink?.includes("instagram.com") &&
        !business.mediaLink.match(/instagram\.com\/(p|reel|tv)\//)
      ) {
        try {
          const username = business.mediaLink
            .split("instagram.com/")[1]
            .split("/")[0]
            .trim();

          const res = await fetch(
            `http://localhost:5175/api/instagram-profile/${username}`
          );
          const data = await res.json();
          if (data.profilePic) setInstaProfilePic(data.profilePic);
        } catch (err) {
          console.warn("Could not load Instagram profile image:", err);
        }
      }
    }

    fetchProfilePic();
  }, [business]);

  if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (!business) return <p style={{ textAlign: "center" }}>Business not found.</p>;

  const media = business.mediaLink;

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
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
          media.includes("youtube.com/watch") ? (
            <iframe
              width="100%"
              height="360"
              src={media.replace("watch?v=", "embed/")}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onClick={() => trackAction("media")}
            ></iframe>
          ) : media.endsWith(".mp4") ? (
            <video
              src={media}
              controls
              style={{ width: "100%", height: "360px", objectFit: "cover" }}
              onPlay={() => trackAction("media")}
            />
          ) : media.includes("instagram.com") ? (
            media.match(/instagram\.com\/(p|reel|tv)\//) ? (
              instagramEmbed ? (
                <div
                  dangerouslySetInnerHTML={{ __html: instagramEmbed }}
                  onClick={() => trackAction("media")}
                />
              ) : (
                <a
                  href={media}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAction("media")}
                  style={{
                    display: "block",
                    height: "360px",
                    background: "#f3f4f6",
                    color: "#007bff",
                    textAlign: "center",
                    lineHeight: "360px",
                    fontWeight: "500",
                  }}
                >
                  View on Instagram
                </a>
              )
            ) : (
              <div
                style={{
                  height: "360px",
                  background: "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
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
                    marginBottom: "12px",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                  }}
                />
                <a
                  href={media}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackAction("media")}
                  style={{
                    color: "#007bff",
                    fontSize: "15px",
                    textDecoration: "underline",
                    fontWeight: "500",
                  }}
                >
                  View Profile on Instagram
                </a>
              </div>
            )
          ) : (
            <img
              src={media}
              alt={business.name}
              style={{ width: "100%", height: "360px", objectFit: "cover" }}
              onClick={() => trackAction("media")}
            />
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
            No image or video
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
            {business.category || "Uncategorized"}
          </div>

       {/* 🏠 Address Section */}
<div style={{ color: "#777", fontSize: "14px", marginBottom: "12px" }}>
  📍 <strong>Address:</strong>{" "}
  {business.mapLink ? (
    <a
      href={business.mapLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackAction("map")}
      style={{
        color: "#22c55e",
        fontWeight: 500,
        textDecoration: "underline",
        marginLeft: "4px",
      }}
    >
      Open in Maps
    </a>
  ) : (
    "Not specified"
  )}
</div>

{/* 💬 Status */}
<p style={{ color: "#777", fontSize: "14px" }}>
  💬 <strong>Status:</strong> {business.status || "Active"}
</p>


          {/* ✅ Action Buttons */}
          <div style={{ marginTop: "24px", display: "flex", gap: "10px" }}>
            {business.whatsappLink && (
              <a
                href={business.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackAction("whatsapp")}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#22c55e",
                  color: "white",
                  borderRadius: "8px",
                  padding: "12px 0",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                💬 Chat on WhatsApp
              </a>
            )}

            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#f3f4f6",
                  color: "#333",
                  borderRadius: "8px",
                  padding: "12px 0",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                🌐 Visit Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
