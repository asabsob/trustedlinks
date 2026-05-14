import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "";

export default function CampaignSettings({
  lang = "en",
}) {
  const isAr = lang === "ar";

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [members, setMembers] =
    useState([]);

  const [campaigns, setCampaigns] =
    useState([]);

  const [participants, setParticipants] =
    useState([]);

  const [form, setForm] =
    useState({
      organizationName: "",
      organizationType: "mall",
      country: "Jordan",
      inviteEmail: "",
      inviteRole: "manager",
    });

  const token =
    localStorage.getItem(
      "campaign_token"
    );

  const t = (en, ar) =>
    isAr ? ar : en;

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        campaignsRes,
        participantsRes,
      ] = await Promise.all([
        fetch(
          `${API_BASE}/api/campaign/campaigns`,
          { headers }
        ),

        fetch(
          `${API_BASE}/api/campaign/participants`,
          { headers }
        ),
      ]);

      const campaignsData =
        await campaignsRes.json();

      const participantsData =
        await participantsRes.json();

      setCampaigns(
        campaignsData.campaigns || []
      );

      setParticipants(
        participantsData.participants || []
      );

      const owner = JSON.parse(
        localStorage.getItem(
          "campaign_owner"
        ) || "{}"
      );

      setForm((prev) => ({
        ...prev,
        organizationName:
          owner.name || "",
        organizationType:
          owner.entityType ||
          "mall",
        country:
          owner.country ||
          "Jordan",
      }));

      setMembers([
        {
          id: 1,
          name:
            owner.name ||
            "Campaign Owner",
          email:
            owner.email || "-",
          role: "owner",
        },
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load settings"
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveOrganization() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await new Promise((r) =>
        setTimeout(r, 700)
      );

      setSuccess(
        t(
          "Settings updated successfully",
          "تم تحديث الإعدادات بنجاح"
        )
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  }

  async function inviteMember() {
    if (!form.inviteEmail) {
      setError(
        t(
          "Email is required",
          "البريد الإلكتروني مطلوب"
        )
      );

      return;
    }

    try {
      setSuccess("");

      await new Promise((r) =>
        setTimeout(r, 600)
      );

      setMembers((prev) => [
        ...prev,
        {
          id: Date.now(),
          name:
            form.inviteEmail.split(
              "@"
            )[0],
          email:
            form.inviteEmail,
          role:
            form.inviteRole,
        },
      ]);

      setForm((prev) => ({
        ...prev,
        inviteEmail: "",
      }));

      setSuccess(
        t(
          "Invitation sent successfully",
          "تم إرسال الدعوة بنجاح"
        )
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to invite"
      );
    }
  }

  async function cancelCampaign(
    id
  ) {
    const confirmAction =
      window.confirm(
        t(
          "Are you sure you want to cancel this campaign?",
          "هل أنت متأكد من إلغاء هذه الحملة؟"
        )
      );

    if (!confirmAction) return;

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status:
                "cancelled",
            }
          : c
      )
    );
  }

  async function removeParticipant(
    id
  ) {
    const confirmAction =
      window.confirm(
        t(
          "Remove this participant?",
          "إزالة هذا المشارك؟"
        )
      );

    if (!confirmAction) return;

    setParticipants((prev) =>
      prev.filter(
        (p) => p.id !== id
      )
    );
  }

  const pageStyle = {
    padding: "24px",
    background: "#f8fafc",
    minHeight: "100vh",
    direction: isAr
      ? "rtl"
      : "ltr",
    fontFamily:
      "Tajawal, Inter, sans-serif",
  };

  const cardStyle = {
    background: "#fff",
    borderRadius: "24px",
    padding: "24px",
    border:
      "1px solid #e5e7eb",
    boxShadow:
      "0 6px 18px rgba(15,23,42,0.04)",
    marginBottom: "24px",
  };

  const sectionTitle = {
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "8px",
  };

  const sectionDesc = {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "20px",
  };

  const inputStyle = {
    width: "100%",
    border:
      "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "14px",
    fontSize: "14px",
    background: "#fff",
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            textAlign: "center",
            marginTop: "90px",
          }}
        >
          {t(
            "Loading settings...",
            "جاري تحميل الإعدادات..."
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* HERO */}
      <section
        style={{
          background:
            "linear-gradient(135deg,#111827,#16a34a)",
          color: "#fff",
          borderRadius: "28px",
          padding: "30px",
          marginBottom: "26px",
        }}
      >
        <div
          style={{
            display:
              "inline-block",
            background:
              "rgba(255,255,255,0.12)",
            padding:
              "6px 12px",
            borderRadius:
              "999px",
            marginBottom:
              "14px",
            fontSize: "13px",
          }}
        >
          {t(
            "Campaign Platform",
            "منصة الحملات"
          )}
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            fontWeight: 800,
          }}
        >
          {t(
            "Settings",
            "الإعدادات"
          )}
        </h1>

        <p
          style={{
            marginTop: "12px",
            opacity: 0.9,
            maxWidth: "760px",
          }}
        >
          {t(
            "Manage organization details, team members, campaigns, and participant access.",
            "إدارة بيانات الجهة والفريق والحملات والمشاركين."
          )}
        </p>
      </section>

      {error && (
        <div
          style={{
            background:
              "#fef2f2",
            color: "#b91c1c",
            padding: "14px",
            borderRadius:
              "16px",
            marginBottom:
              "20px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background:
              "#ecfdf5",
            color: "#166534",
            padding: "14px",
            borderRadius:
              "16px",
            marginBottom:
              "20px",
          }}
        >
          {success}
        </div>
      )}

      {/* ORG */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>
          {t(
            "Organization Settings",
            "إعدادات الجهة"
          )}
        </h2>

        <div style={sectionDesc}>
          {t(
            "Update organization information and campaign profile.",
            "تحديث بيانات الجهة وملف الحملة."
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: "16px",
          }}
        >
          <Field
            label={t(
              "Organization Name",
              "اسم الجهة"
            )}
          >
            <input
              value={
                form.organizationName
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  organizationName:
                    e.target.value,
                })
              }
              style={inputStyle}
            />
          </Field>

          <Field
            label={t(
              "Organization Type",
              "نوع الجهة"
            )}
          >
            <select
              value={
                form.organizationType
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  organizationType:
                    e.target.value,
                })
              }
              style={inputStyle}
            >
              <option value="mall">
                {t(
                  "Mall",
                  "مول"
                )}
              </option>

              <option value="government">
                {t(
                  "Government",
                  "جهة حكومية"
                )}
              </option>

              <option value="event">
                {t(
                  "Event",
                  "فعالية"
                )}
              </option>

              <option value="sponsor">
                {t(
                  "Sponsor",
                  "راعي"
                )}
              </option>
            </select>
          </Field>

          <Field
            label={t(
              "Country",
              "الدولة"
            )}
          >
            <select
              value={
                form.country
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  country:
                    e.target.value,
                })
              }
              style={inputStyle}
            >
              <option>
                Jordan
              </option>
              <option>
                Saudi Arabia
              </option>
              <option>
                Qatar
              </option>
              <option>
                UAE
              </option>
              <option>
                Kuwait
              </option>
            </select>
          </Field>
        </div>

        <button
          onClick={
            saveOrganization
          }
          disabled={saving}
          style={{
            marginTop: "20px",
            background:
              "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius:
              "14px",
            padding:
              "14px 22px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {saving
            ? t(
                "Saving...",
                "جاري الحفظ..."
              )
            : t(
                "Save Changes",
                "حفظ التغييرات"
              )}
        </button>
      </section>

      {/* TEAM */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>
          {t(
            "Team Access",
            "إدارة الفريق"
          )}
        </h2>

        <div style={sectionDesc}>
          {t(
            "Invite managers and administrators to access the campaign dashboard.",
            "دعوة المدراء والمسؤولين للوصول إلى لوحة الحملات."
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: "16px",
          }}
        >
          <Field
            label={t(
              "Email Address",
              "البريد الإلكتروني"
            )}
          >
            <input
              value={
                form.inviteEmail
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  inviteEmail:
                    e.target.value,
                })
              }
              style={inputStyle}
            />
          </Field>

          <Field
            label={t(
              "Role",
              "الصلاحية"
            )}
          >
            <select
              value={
                form.inviteRole
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  inviteRole:
                    e.target.value,
                })
              }
              style={inputStyle}
            >
              <option value="manager">
                {t(
                  "Manager",
                  "مدير"
                )}
              </option>

              <option value="admin">
                {t(
                  "Administrator",
                  "مسؤول"
                )}
              </option>

              <option value="viewer">
                {t(
                  "Viewer",
                  "مشاهد"
                )}
              </option>
            </select>
          </Field>
        </div>

        <button
          onClick={
            inviteMember
          }
          style={{
            marginTop: "20px",
            background:
              "#111827",
            color: "#fff",
            border: "none",
            borderRadius:
              "14px",
            padding:
              "14px 22px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t(
            "Send Invitation",
            "إرسال الدعوة"
          )}
        </button>

        <div
          style={{
            marginTop: "28px",
          }}
        >
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                padding:
                  "14px 0",
                borderBottom:
                  "1px solid #f1f5f9",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  {m.name}
                </div>

                <div
                  style={{
                    color:
                      "#64748b",
                    fontSize:
                      "13px",
                  }}
                >
                  {m.email}
                </div>
              </div>

              <div
                style={{
                  background:
                    "#f1f5f9",
                  padding:
                    "6px 12px",
                  borderRadius:
                    "999px",
                  fontSize:
                    "13px",
                }}
              >
                {m.role}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAMPAIGNS */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>
          {t(
            "Campaign Controls",
            "إدارة الحملات"
          )}
        </h2>

        <div style={sectionDesc}>
          {t(
            "Pause or cancel campaigns.",
            "إيقاف أو إلغاء الحملات."
          )}
        </div>

        {campaigns.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              padding:
                "16px 0",
              borderBottom:
                "1px solid #f1f5f9",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                }}
              >
                {c.name}
              </div>

              <div
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "13px",
                }}
              >
                {c.status}
              </div>
            </div>

            <button
              onClick={() =>
                cancelCampaign(
                  c.id
                )
              }
              style={{
                background:
                  "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius:
                  "12px",
                padding:
                  "10px 14px",
                cursor: "pointer",
              }}
            >
              {t(
                "Cancel",
                "إلغاء"
              )}
            </button>
          </div>
        ))}
      </section>

      {/* PARTICIPANTS */}
      <section style={cardStyle}>
        <h2 style={sectionTitle}>
          {t(
            "Participant Controls",
            "إدارة المشاركين"
          )}
        </h2>

        <div style={sectionDesc}>
          {t(
            "Remove participants from campaign sponsorship.",
            "إزالة المشاركين من الرعاية."
          )}
        </div>

        {participants.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              padding:
                "16px 0",
              borderBottom:
                "1px solid #f1f5f9",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 700,
                }}
              >
                {isAr
                  ? p.name_ar ||
                    p.name
                  : p.name}
              </div>

              <div
                style={{
                  color:
                    "#64748b",
                  fontSize:
                    "13px",
                }}
              >
                {p.whatsapp}
              </div>
            </div>

            <button
              onClick={() =>
                removeParticipant(
                  p.id
                )
              }
              style={{
                background:
                  "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius:
                  "12px",
                padding:
                  "10px 14px",
                cursor: "pointer",
              }}
            >
              {t(
                "Remove",
                "إزالة"
              )}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <div>
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {label}
      </div>

      {children}
    </div>
  );
}
