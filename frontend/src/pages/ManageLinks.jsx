import React, { useEffect, useMemo, useState } from "react";
import WhatsAppVerify from "../components/WhatsAppVerify";
import LocationPicker from "../components/LocationPicker";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://trustedlinks-backend-production.up.railway.app";

export default function ManageLinks({ lang = "en" }) {
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const token = localStorage.getItem("trustedlinks_token");

  const [business, setBusiness] = useState(null);
  const [originalForm, setOriginalForm] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiCorrectionNotes, setAiCorrectionNotes] = useState("");
  const [reportsData, setReportsData] = useState(null);

  const [activeTab, setActiveTab] = useState("details");

  const metaCategories = useMemo(
    () => [
      { key: "AUTOMOTIVE", en: "Automotive", ar: "سيارات" },
      { key: "BEAUTY_SPA_SALON", en: "Beauty, Spa and Salon", ar: "تجميل وصالون" },
      { key: "CLOTHING_APPAREL", en: "Clothing and Apparel", ar: "ملابس وأزياء" },
      { key: "EDUCATION", en: "Education", ar: "تعليم" },
      { key: "ENTERTAINMENT", en: "Entertainment", ar: "ترفيه" },
      { key: "EVENT_PLANNING", en: "Event Planning and Service", ar: "تنظيم الفعاليات والخدمات" },
      { key: "FINANCE_BANKING", en: "Finance and Banking", ar: "تمويل وبنوك" },
      { key: "FOOD_GROCERY", en: "Food and Grocery", ar: "طعام وبقالة" },
      { key: "BEVERAGES", en: "Beverages", ar: "مشروبات" },
      { key: "PUBLIC_SERVICE", en: "Public Service", ar: "خدمات عامة" },
      { key: "HOTEL_LODGING", en: "Hotel and Lodging", ar: "فنادق وإقامة" },
      { key: "MEDICAL_HEALTH", en: "Medical and Health", ar: "صحة وطبية" },
      { key: "NON_PROFIT", en: "Non-profit", ar: "غير ربحي" },
      { key: "PROFESSIONAL_SERVICES", en: "Professional Services", ar: "خدمات مهنية" },
      { key: "SHOPPING_RETAIL", en: "Shopping and Retail", ar: "تسوق وتجزئة" },
      { key: "TRAVEL_TRANSPORTATION", en: "Travel and Transportation", ar: "سفر ومواصلات" },
      { key: "RESTAURANT", en: "Restaurant / Cafe", ar: "مطعم / مقهى" },
      { key: "OTHER", en: "Other", ar: "أخرى" },
    ],
    []
  );

  const t = useMemo(
    () =>
      ({
        en: {
          title: "Manage Your Business Information",
          desc: "Update your business profile, category, localized descriptions, localized keywords, media link, location, and WhatsApp details.",
          statusTitle: "Visibility Status",
          visible_yes: "✅ Live and visible in search",
          visible_pending: "🕓 Pending review",
          visible_no: "⛔ Hidden from search",
          status: "Status",
          details: "Business Details",
          detailsDesc: "Edit the core information displayed for your business profile.",
          name: "Business Name",
          nameAr: "Business Name (Arabic)",
          category: "Category",
          description: "Description",
          descriptionAr: "Arabic Description",
          keywords: "Keywords",
          keywordsAr: "Arabic Keywords",
          media: "Media / Instagram Link",
          map: "Business Location",
          mapLink: "Map Link",
          coordinates: "Coordinates",
          openLocation: "Open location",
          save: "Save Changes",
          saving: "Saving...",
          success: "✅ Updated successfully!",
          update_failed: "❌ Update failed.",
          load_failed: "❌ Failed to load business info.",
          whatsappTitle: "Update WhatsApp Number",
          whatsappDesc: "Verify and update the WhatsApp number connected to this business.",
          actions: "Account Actions",
          actionsDesc: "Careful actions that affect your business visibility or account presence.",
          suspend: "Suspend Link",
          reactivate: "Reactivate Link",
          delete: "Delete Business",
          confirmDelete: "Are you sure you want to delete this business?",
          loading: "Loading...",
          selectCategory: "Select category",

          aiTitle: "AI Optimization",
          aiDesc: "Use AI to improve your description, keywords, and call-to-action based on your business data.",
          aiButton: "✨ Optimize with AI",
          aiLoading: "Optimizing...",
          aiResult: "AI Optimization Result",
          aiHeadline: "Headline",
          aiDescription: "Optimized Description",
          aiKeywords: "Suggested Keywords",
          aiCta: "CTA",
          aiScore: "Score",
          aiApply: "🚀 Apply & Improve My Business",
          aiFailed: "AI optimization failed",
          aiRecommendations: "Recommendations",
          aiStart: "Start AI optimization",
          aiCorrectionNotes: "AI correction notes",
          aiCorrectionPlaceholder:
            "Example: Do not mention Arabic tea, we serve Taiwanese bubble tea",
          currentTopKeywords: "Current top search keywords",
          lowConversionKeywords: "Low conversion keywords",
          tabs_details: "Details",
          tabs_ai: "AI Optimization",
          tabs_whatsapp: "WhatsApp",
          tabs_settings: "Settings",
          noChanges: "No changes to save",
          confirmSave: "Do you want to save these changes?",
          saveFirst: "✅ AI suggestions applied — please save changes",
          reoptimize: "🔄 Re-optimize",
          unsavedChanges: "⚠️ Unsaved changes",
          aiPoweredHint: "💡 Optimized using real user search data",
        },
        ar: {
          title: "إدارة معلومات نشاطك",
          desc: "قم بتحديث ملف نشاطك، الفئة، الأوصاف الثنائية، الكلمات المفتاحية الثنائية، الرابط الإعلامي، الموقع، وتفاصيل واتساب.",
          statusTitle: "حالة الظهور",
          visible_yes: "✅ ظاهر ومتاح في البحث",
          visible_pending: "🕓 قيد المراجعة",
          visible_no: "⛔ مخفي من البحث",
          status: "الحالة",
          details: "بيانات النشاط",
          detailsDesc: "عدّل المعلومات الأساسية الظاهرة في ملف نشاطك.",
          name: "اسم النشاط",
          nameAr: "اسم النشاط بالعربية",
          category: "الفئة",
          description: "الوصف",
          descriptionAr: "الوصف العربي",
          keywords: "الكلمات المفتاحية",
          keywordsAr: "الكلمات المفتاحية العربية",
          media: "رابط الوسائط أو إنستغرام",
          map: "موقع النشاط",
          mapLink: "رابط الخريطة",
          coordinates: "الإحداثيات",
          openLocation: "فتح الموقع",
          save: "حفظ التغييرات",
          saving: "جارٍ الحفظ...",
          success: "✅ تم التحديث بنجاح!",
          update_failed: "❌ فشل التحديث.",
          load_failed: "❌ فشل تحميل بيانات النشاط.",
          whatsappTitle: "تحديث رقم واتساب",
          whatsappDesc: "قم بتوثيق وتحديث رقم واتساب المرتبط بهذا النشاط.",
          actions: "إجراءات الحساب",
          actionsDesc: "إجراءات حساسة تؤثر على ظهور النشاط أو وجوده في المنصة.",
          suspend: "تعليق الرابط",
          reactivate: "إعادة التفعيل",
          delete: "حذف النشاط",
          confirmDelete: "هل أنت متأكد من حذف النشاط؟",
          loading: "جارٍ التحميل...",
          selectCategory: "اختر الفئة",

          aiTitle: "التحسين بالذكاء الاصطناعي",
          aiDesc: "استخدم الذكاء الاصطناعي لتحسين الوصف والكلمات المفتاحية والدعوة إلى الإجراء بناءً على بيانات نشاطك.",
          aiButton: "✨ تحسين بالذكاء",
          aiLoading: "جارٍ التحسين...",
          aiResult: "نتائج التحسين الذكي",
          aiHeadline: "عنوان مقترح",
          aiDescription: "وصف محسّن",
          aiKeywords: "كلمات مفتاحية مقترحة",
          aiCta: "دعوة للإجراء",
          aiScore: "التقييم",
          aiApply: "🚀 تطبيق التحسين وزيادة العملاء",
          aiFailed: "فشل التحسين بالذكاء الاصطناعي",
          aiRecommendations: "التوصيات",
          aiStart: "ابدأ التحسين الذكي",
          aiCorrectionNotes: "ملاحظات أو تصحيح للذكاء الاصطناعي",
          aiCorrectionPlaceholder:
            "مثال: لا تذكر شاي عربي، نحن نقدم bubble tea تايواني",
          currentTopKeywords: "أهم كلمات البحث الحالية",
          lowConversionKeywords: "الكلمات ضعيفة التحويل",
          tabs_details: "البيانات",
          tabs_ai: "التحسين الذكي",
          tabs_whatsapp: "واتساب",
          tabs_settings: "الإعدادات",
          noChanges: "لا توجد تغييرات للحفظ",
          confirmSave: "هل تريد حفظ هذه التغييرات؟",
          saveFirst: "✅ تم تطبيق التحسين — يرجى حفظ التغييرات",
          reoptimize: "🔄 إعادة التحسين",
          unsavedChanges: "⚠️ لديك تغييرات غير محفوظة",
          aiPoweredHint: "💡 تم تحسين النص اعتمادًا على بيانات البحث الفعلية",
        },
      }[lang] || {}),
    [lang]
  );

  const normalizeFormForCompare = (value) => ({
    name: value?.name || "",
    name_ar: value?.name_ar || "",
    category: Array.isArray(value?.category)
      ? value.category
      : value?.category
      ? [value.category]
      : [],
    description: value?.description || "",
    description_ar: value?.description_ar || "",
    keywords: Array.isArray(value?.keywords) ? value.keywords : [],
    keywords_ar: Array.isArray(value?.keywords_ar) ? value.keywords_ar : [],
    mediaLink: value?.mediaLink || "",
    mapLink: value?.mapLink || "",
    latitude: value?.latitude ?? null,
    longitude: value?.longitude ?? null,
    whatsapp: value?.whatsapp || "",
    status: value?.status || "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setFeedback({ type: "", text: "" });

        const businessRes = await fetch(`${API_BASE}/api/business/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!businessRes.ok) throw new Error(`HTTP ${businessRes.status}`);
        const businessData = await businessRes.json();

        if (cancelled) return;

        const prepared = {
          ...businessData,
          keywords: Array.isArray(businessData?.keywords) ? businessData.keywords : [],
          keywords_ar: Array.isArray(businessData?.keywords_ar) ? businessData.keywords_ar : [],
        };

        setBusiness(businessData);
        setForm(prepared);
        setOriginalForm(normalizeFormForCompare(prepared));

        try {
          const reportsRes = await fetch(`${API_BASE}/api/business/reports`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const reportsJson = await reportsRes.json().catch(() => null);
          if (reportsRes.ok) {
            setReportsData(reportsJson);
          }
        } catch (reportsErr) {
          console.error("Failed to load reports data for AI:", reportsErr);
        }
      } catch (err) {
        console.error("Failed to load business info:", err);
        if (!cancelled) {
          setBusiness(null);
          setForm({});
          setOriginalForm(null);
          setFeedback({ type: "error", text: t.load_failed || "Failed to load" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!token) {
      setLoading(false);
      setBusiness(null);
      setForm({});
      setOriginalForm(null);
      return;
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, t.load_failed]);

  const visibilityText =
    business?.status === "Active"
      ? t.visible_yes
      : business?.status === "Pending"
      ? t.visible_pending
      : t.visible_no;

  const categoryValue = Array.isArray(form.category)
    ? form.category[0] || ""
    : typeof form.category === "object"
    ? form.category.key || ""
    : form.category || "";

  const categoryLabel = useMemo(() => {
    const current = metaCategories.find((c) => c.key === categoryValue);
    return current ? (isAr ? current.ar : current.en) : categoryValue || "-";
  }, [categoryValue, metaCategories, isAr]);

  const currentLocation =
    form.latitude != null && form.longitude != null
      ? {
          lat: Number(form.latitude),
          lng: Number(form.longitude),
        }
      : null;

  const topSearchKeywords = useMemo(() => {
    return Array.isArray(reportsData?.keywords)
      ? reportsData.keywords
          .slice(0, 5)
          .map((k) => String(k.keyword || "").trim())
          .filter(Boolean)
      : [];
  }, [reportsData]);

  const lowConversionKeywords = useMemo(() => {
    return Array.isArray(reportsData?.keywords)
      ? reportsData.keywords
          .filter((k) => {
            const searches = Number(k.searches || 0);
            const clicks = Number(k.clicks || 0);
            const conversion = searches > 0 ? (clicks / searches) * 100 : 0;
            return searches >= 3 && conversion < 20;
          })
          .slice(0, 5)
          .map((k) => String(k.keyword || "").trim())
          .filter(Boolean)
      : [];
  }, [reportsData]);

  const currentDescription = isAr
    ? form.description_ar || ""
    : form.description || "";

  const currentKeywords = isAr
    ? Array.isArray(form.keywords_ar)
      ? form.keywords_ar
      : []
    : Array.isArray(form.keywords)
    ? form.keywords
    : [];

  const isDirty = useMemo(() => {
    if (!originalForm) return false;
    return JSON.stringify(normalizeFormForCompare(form)) !== JSON.stringify(originalForm);
  }, [form, originalForm]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      [isAr ? "description_ar" : "description"]: value,
    }));
  };

  const handleLocalizedKeywordsChange = (e) => {
    const value = e.target.value || "";
    const parsed = value
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    setForm((prev) => ({
      ...prev,
      [isAr ? "keywords_ar" : "keywords"]: parsed,
    }));
  };

  const updateBusiness = async () => {
    try {
      if (!isDirty) {
        setFeedback({ type: "error", text: t.noChanges });
        return;
      }

      const confirmed = window.confirm(t.confirmSave);
      if (!confirmed) return;

      setSaving(true);
      setFeedback({ type: "", text: "" });

      const payload = {
        ...form,
        category:
          typeof form.category === "object" && form.category?.key
            ? [form.category.key]
            : Array.isArray(form.category)
            ? form.category
            : form.category
            ? [form.category]
            : [],
        keywords: Array.isArray(form.keywords)
          ? form.keywords.map((k) => String(k).trim()).filter(Boolean)
          : [],
        keywords_ar: Array.isArray(form.keywords_ar)
          ? form.keywords_ar.map((k) => String(k).trim()).filter(Boolean)
          : [],
        description: typeof form.description === "string" ? form.description.trim() : "",
        description_ar:
          typeof form.description_ar === "string" ? form.description_ar.trim() : "",
        latitude:
          typeof form.latitude === "number"
            ? form.latitude
            : Number(form.latitude) || null,
        longitude:
          typeof form.longitude === "number"
            ? form.longitude
            : Number(form.longitude) || null,
      };

      const res = await fetch(`${API_BASE}/api/business/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");

      const updatedBusiness = data.business || data;
      const prepared = {
        ...updatedBusiness,
        keywords: Array.isArray(updatedBusiness?.keywords) ? updatedBusiness.keywords : [],
        keywords_ar: Array.isArray(updatedBusiness?.keywords_ar)
          ? updatedBusiness.keywords_ar
          : [],
      };

      setBusiness(updatedBusiness);
      setForm(prepared);
      setOriginalForm(normalizeFormForCompare(prepared));
      setFeedback({ type: "success", text: t.success });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: t.update_failed });
    } finally {
      setSaving(false);
    }
  };

  const runAIOptimization = async () => {
    try {
      setAiLoading(true);
      setFeedback({ type: "", text: "" });

      const sourceDescription = isAr
        ? form.description_ar || form.description || ""
        : form.description || "";

      const autoNotes =
        form.name?.toLowerCase().includes("bubble") ||
        sourceDescription?.toLowerCase().includes("bubble")
          ? "This is Taiwanese bubble tea. Do NOT mention Arabic tea."
          : "";

      const res = await fetch(`${API_BASE}/api/business/ai-optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lang: isAr ? "ar" : "en",
          topSearchKeywords,
          lowConversionKeywords,
          correctionNotes: `${autoNotes} ${aiCorrectionNotes || ""}`.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");

      setAiResult(data.result || null);
      setActiveTab("ai");
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: t.aiFailed });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiResult) return;

    const parsedKeywords = Array.isArray(aiResult.suggestedKeywords)
      ? aiResult.suggestedKeywords
          .flatMap((k) => String(k).split(",").map((x) => x.trim()))
          .filter(Boolean)
      : [];

    setForm((prev) => ({
      ...prev,
      [isAr ? "description_ar" : "description"]:
        aiResult.optimizedDescription ||
        prev[isAr ? "description_ar" : "description"] ||
        "",
      [isAr ? "keywords_ar" : "keywords"]:
        parsedKeywords.length
          ? parsedKeywords
          : prev[isAr ? "keywords_ar" : "keywords"] || [],
    }));

    setFeedback({
      type: "success",
      text: t.saveFirst,
    });

    setActiveTab("details");
  };

  const deleteBusiness = async () => {
    if (!window.confirm(t.confirmDelete)) return;

    try {
      await fetch(`${API_BASE}/api/business/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
   } finally {
  localStorage.removeItem("trustedlinks_token");
  localStorage.removeItem("trustedlinks_user_email");
  localStorage.removeItem("pendingBusiness");
  localStorage.removeItem("otpToken");
  window.location.href = "/";
}
  };

  const toggleStatus = async () => {
    try {
      setFeedback({ type: "", text: "" });

      const res = await fetch(`${API_BASE}/api/business/toggle-status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed");

      setBusiness((prev) => ({ ...(prev || {}), status: data.status }));
      setForm((prev) => ({ ...(prev || {}), status: data.status }));
      setOriginalForm((prev) => ({ ...(prev || {}), status: data.status }));
      setFeedback({
        type: "success",
        text: `${t.status}: ${data.status || "updated"}`,
      });
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: t.update_failed });
    }
  };

  if (loading) {
    return (
      <div style={pageWrap(dir)}>
        <div style={loadingCard}>{t.loading}</div>
      </div>
    );
  }

  return (
    <div style={pageWrap(dir)}>
      <section style={heroCard}>
        <div style={heroBadge}>{t.details}</div>
        <h1 style={heroTitle}>{t.title}</h1>
        <p style={heroSubtitle}>{t.desc}</p>
      </section>

      {feedback.text ? (
        <div style={feedback.type === "success" ? successBox : errorBox}>
          {feedback.text}
        </div>
      ) : null}

      <section style={statusCard}>
        <div style={{ fontWeight: 700, color: "#166534" }}>
          {t.statusTitle}: {visibilityText}
        </div>
        {business?.status && (
          <div style={{ fontWeight: 700, color: "#166534" }}>
            {t.status}: {business.status}
          </div>
        )}
      </section>

      <section style={tabsWrap}>
        {[
          { key: "details", label: t.tabs_details },
          { key: "ai", label: t.tabs_ai },
          { key: "whatsapp", label: t.tabs_whatsapp },
          { key: "settings", label: t.tabs_settings },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={tabButtonStyle(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "details" && (
        <section style={singlePanelWrap}>
          <div style={panelCard}>
            <div style={panelHeader}>
              <h3 style={panelTitle}>{t.details}</h3>
              <p style={panelDesc}>{t.detailsDesc}</p>
            </div>

            <div style={summaryRow}>
              <div style={summaryChip}>
                <span style={summaryChipLabel}>{t.category}</span>
                <strong>{categoryLabel}</strong>
              </div>
              <div style={summaryChip}>
                <span style={summaryChipLabel}>{t.status}</span>
                <strong>{business?.status || "-"}</strong>
              </div>
            </div>

            {isDirty && <div style={unsavedNoticeStyle}>{t.unsavedChanges}</div>}

            <div style={formGrid}>
              <div style={fieldBlock}>
                <label style={labelStyle}>
                  {t.name} <span style={requiredStarStyle}>*</span>
                </label>
                <input
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  placeholder={t.name}
                  style={inputStyle(isAr)}
                />
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>{t.nameAr}</label>
                <input
                  name="name_ar"
                  value={form.name_ar || ""}
                  onChange={handleChange}
                  placeholder={t.nameAr}
                  style={inputStyle(isAr)}
                />
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>
                  {t.category} <span style={requiredStarStyle}>*</span>
                </label>
                <select
                  value={categoryValue}
                  onChange={(e) => {
                    const selected = metaCategories.find((c) => c.key === e.target.value);
                    if (!selected) return;

                    setForm((prev) => ({
                      ...prev,
                      category: [selected.key],
                    }));
                  }}
                  style={inputStyle(isAr)}
                >
                  <option value="">{t.selectCategory}</option>
                  {metaCategories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {isAr ? c.ar : c.en}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ ...fieldBlock, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>{isAr ? t.descriptionAr : t.description}</label>
                <textarea
                  name={isAr ? "description_ar" : "description"}
                  value={currentDescription}
                  onChange={handleDescriptionChange}
                  placeholder={
                    isAr
                      ? "اكتب وصف النشاط بالعربية"
                      : "Write your business description in English"
                  }
                  style={{
                    ...inputStyle(isAr),
                    minHeight: "110px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ ...fieldBlock, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>{isAr ? t.keywordsAr : t.keywords}</label>
                <input
                  name={isAr ? "keywords_ar" : "keywords"}
                  value={currentKeywords.join(", ")}
                  onChange={handleLocalizedKeywordsChange}
                  placeholder={
                    isAr
                      ? "مثال: شاي الفقاعات, مشروبات, شاي تايواني"
                      : "Example: bubble tea, drinks, Taiwanese tea"
                  }
                  style={inputStyle(isAr)}
                />
                {currentKeywords.length > 0 && (
                  <div style={tagsWrapStyle}>
                    {currentKeywords.map((tag, idx) => (
                      <span key={`${tag}-${idx}`} style={tagStyle}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>{t.media}</label>
                <input
                  name="mediaLink"
                  value={form.mediaLink || ""}
                  onChange={handleChange}
                  placeholder="https://instagram.com/..."
                  style={inputStyle(isAr)}
                />
              </div>

              <div style={fieldBlock}>
                <label style={labelStyle}>{t.mapLink}</label>
                <input
                  name="mapLink"
                  value={form.mapLink || ""}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  style={inputStyle(isAr)}
                />
                {form.mapLink ? (
                  <a
                    href={form.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    style={linkStyle}
                  >
                    {t.openLocation}
                  </a>
                ) : null}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ ...labelStyle, marginBottom: 10 }}>{t.map}</label>

              <LocationPicker
                value={currentLocation}
                onChange={({ lat, lng }) => {
                  setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    mapLink: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
                  }));
                }}
                height={320}
              />

              <div style={coordsBox}>
                <div>
                  <span style={summaryChipLabel}>{t.coordinates}</span>
                  <strong>
                    {currentLocation
                      ? `${Number(currentLocation.lat).toFixed(5)}, ${Number(currentLocation.lng).toFixed(5)}`
                      : "-"}
                  </strong>
                </div>
              </div>
            </div>

            <div style={actionButtonsWrap}>
              <button
                onClick={updateBusiness}
                disabled={!isDirty || saving}
                style={primaryBtnDisabled(!isDirty || saving)}
              >
                {saving ? t.saving : t.save}
              </button>

              <button
                onClick={runAIOptimization}
                disabled={aiLoading}
                style={{
                  ...darkBtnStyle,
                  opacity: aiLoading ? 0.7 : 1,
                }}
              >
                {aiLoading ? t.aiLoading : t.aiButton}
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === "ai" && (
        <section style={singlePanelWrap}>
          <div style={panelCard}>
            <div style={panelHeader}>
              <h3 style={panelTitle}>{t.aiTitle}</h3>
              <p style={panelDesc}>{t.aiDesc}</p>
            </div>

            <div style={aiHeroStyle}>
              <div style={aiHeroTitleStyle}>
                ✨ {isAr ? "تحسين ذكي لنشاطك" : "Smart AI Optimization"}
              </div>
              <div style={aiHeroSubtitleStyle}>
                {isAr
                  ? "حسّن الظهور والوصف والكلمات المفتاحية بناءً على بيانات البحث"
                  : "Improve visibility, description, and keywords based on real search data"}
              </div>
              <div style={aiPoweredHintStyle}>{t.aiPoweredHint}</div>
            </div>

            <div style={summaryRow}>
              <div style={summaryChip}>
                <span style={summaryChipLabel}>{t.currentTopKeywords}</span>
                <strong style={chipTextStyle}>{topSearchKeywords.join(", ") || "-"}</strong>
              </div>

              <div style={summaryChip}>
                <span style={summaryChipLabel}>{t.lowConversionKeywords}</span>
                <strong style={chipTextStyle}>{lowConversionKeywords.join(", ") || "-"}</strong>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>{t.aiCorrectionNotes}</label>
              <textarea
                value={aiCorrectionNotes}
                onChange={(e) => setAiCorrectionNotes(e.target.value)}
                placeholder={t.aiCorrectionPlaceholder}
                style={{
                  ...inputStyle(isAr),
                  minHeight: "90px",
                  resize: "vertical",
                }}
              />
            </div>

            {!aiResult ? (
              <div style={emptyAiStyle}>
                <div style={{ marginBottom: 12, fontWeight: 700 }}>{t.aiStart}</div>
                <button
                  onClick={runAIOptimization}
                  disabled={aiLoading}
                  style={{
                    ...darkBtnStyle,
                    opacity: aiLoading ? 0.7 : 1,
                  }}
                >
                  {aiLoading ? t.aiLoading : t.aiButton}
                </button>
              </div>
            ) : (
              <div style={aiGridStyle}>
                <div style={aiMainCardStyle}>
                  <div style={aiScoreBox(aiResult.score)}>
                    {t.aiScore}: {aiResult.score || 0}/100
                  </div>

                  <div style={aiSectionStyle}>
                    <strong>{t.aiHeadline}:</strong>
                    <div>{aiResult.headline || "-"}</div>
                  </div>

                  <div style={aiSectionStyle}>
                    <strong>{t.aiDescription}:</strong>
                    <div>{aiResult.optimizedDescription || "-"}</div>
                  </div>

                  <div style={aiSectionStyle}>
                    <strong>{t.aiKeywords}:</strong>
                    <div>
                      {Array.isArray(aiResult.suggestedKeywords)
                        ? aiResult.suggestedKeywords.join(", ")
                        : "-"}
                    </div>
                  </div>

                  <div style={aiSectionStyle}>
                    <strong>{t.aiCta}:</strong>
                    <div>{aiResult.cta || "-"}</div>
                  </div>

                  <div style={aiButtonsRowStyle}>
                    <button
                      onClick={applyAiSuggestions}
                      style={{
                        ...primaryBtn,
                        background: "#2563eb",
                      }}
                    >
                      {t.aiApply}
                    </button>

                    <button
                      onClick={runAIOptimization}
                      disabled={aiLoading}
                      style={{
                        ...darkBtnStyle,
                        opacity: aiLoading ? 0.7 : 1,
                      }}
                    >
                      {aiLoading ? t.aiLoading : t.reoptimize}
                    </button>
                  </div>
                </div>

                <div style={aiSideCardStyle}>
                  <div style={aiCardTitleStyle}>{t.aiRecommendations}</div>
                  {Array.isArray(aiResult.recommendations) && aiResult.recommendations.length ? (
                    aiResult.recommendations.map((item, idx) => (
                      <div key={`${item}-${idx}`} style={recommendationItemStyle}>
                        💡 {item}
                      </div>
                    ))
                  ) : (
                    <div style={mutedTextStyle}>-</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "whatsapp" && (
        <section style={singlePanelWrap}>
          <div style={panelCard}>
            <div style={panelHeader}>
              <h3 style={panelTitle}>{t.whatsappTitle}</h3>
              <p style={panelDesc}>{t.whatsappDesc}</p>
            </div>

            <WhatsAppVerify
              lang={lang}
              token={token}
              businessName={business?.name || ""}
              currentWhatsapp={business?.whatsapp || ""}
              onVerified={(result) => {
                setForm((prev) => ({
                  ...prev,
                  whatsapp: result?.whatsapp || prev.whatsapp,
                }));
                setFeedback({
                  type: "success",
                  text: isAr
                    ? "✅ تم تحديث رقم واتساب بنجاح."
                    : "✅ WhatsApp number verified successfully.",
                });
              }}
            />
          </div>
        </section>
      )}

      {activeTab === "settings" && (
        <section style={singlePanelWrap}>
          <div style={panelCard}>
            <div style={panelHeader}>
              <h3 style={panelTitle}>{t.actions}</h3>
              <p style={panelDesc}>{t.actionsDesc}</p>
            </div>

            <div style={actionsWrap}>
              <button onClick={toggleStatus} style={warningBtn}>
                {business?.status === "Suspended" ? t.reactivate : t.suspend}
              </button>

              <button onClick={deleteBusiness} style={dangerBtn}>
                {t.delete}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const pageWrap = (dir) => ({
  maxWidth: "1280px",
  margin: "0 auto",
  padding: "24px",
  direction: dir,
});

const heroCard = {
  background: "linear-gradient(135deg, #16a34a 0%, #34d399 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "28px",
  marginBottom: "18px",
  boxShadow: "0 10px 30px rgba(22, 163, 74, 0.18)",
};

const heroBadge = {
  display: "inline-block",
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.25)",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "14px",
};

const heroTitle = {
  margin: "0 0 8px",
  fontSize: "30px",
  fontWeight: 800,
};

const heroSubtitle = {
  margin: 0,
  maxWidth: "760px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.95)",
};

const statusCard = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "16px",
  padding: "16px 20px",
  marginBottom: "18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const tabsWrap = {
  display: "flex",
  gap: "10px",
  marginBottom: "18px",
  flexWrap: "wrap",
};

const tabButtonStyle = (active) => ({
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  background: active ? "#16a34a" : "#fff",
  color: active ? "#fff" : "#111827",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
});

const singlePanelWrap = {
  marginBottom: "18px",
};

const panelCard = {
  background: "#fff",
  borderRadius: "18px",
  padding: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
};

const panelHeader = {
  marginBottom: "16px",
};

const panelTitle = {
  margin: "0 0 6px",
  fontSize: "22px",
  color: "#111827",
};

const panelDesc = {
  margin: 0,
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: 1.6,
};

const summaryRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const summaryChip = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "10px 14px",
  minWidth: "220px",
  flex: "1 1 260px",
};

const summaryChipLabel = {
  display: "block",
  fontSize: "12px",
  color: "#6b7280",
  marginBottom: "4px",
};

const chipTextStyle = {
  display: "block",
  lineHeight: 1.6,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "14px",
};

const fieldBlock = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: 700,
  marginBottom: "8px",
  color: "#111827",
};

const requiredStarStyle = {
  color: "#dc2626",
  marginInlineStart: 4,
};

const inputStyle = (isAr) => ({
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#fff",
  boxSizing: "border-box",
  textAlign: isAr ? "right" : "left",
  fontSize: "15px",
});

const linkStyle = {
  display: "inline-block",
  marginTop: "8px",
  color: "#16a34a",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "14px",
};

const coordsBox = {
  marginTop: "12px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "12px 14px",
};

const actionButtonsWrap = {
  marginTop: 18,
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const actionsWrap = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const primaryBtn = {
  background: "#16a34a",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "0.2s",
};

const darkBtnStyle = {
  background: "#111827",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
  transition: "0.2s",
};

const primaryBtnDisabled = (disabled) => ({
  ...primaryBtn,
  background: disabled ? "#9ca3af" : "#16a34a",
  opacity: disabled ? 0.7 : 1,
  cursor: disabled ? "not-allowed" : "pointer",
});

const warningBtn = {
  background: "#f59e0b",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerBtn = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const loadingCard = {
  minHeight: "40vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#374151",
  fontSize: "18px",
  fontWeight: 600,
};

const successBox = {
  marginBottom: "16px",
  background: "#f0fdf4",
  border: "1px solid #86efac",
  color: "#166534",
  borderRadius: "14px",
  padding: "12px 14px",
  fontSize: "14px",
  fontWeight: 600,
};

const errorBox = {
  marginBottom: "16px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: "14px",
  padding: "12px 14px",
  fontSize: "14px",
  fontWeight: 600,
};

const unsavedNoticeStyle = {
  marginBottom: 12,
  color: "#f59e0b",
  fontWeight: 700,
};

const emptyAiStyle = {
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "16px",
  padding: "20px",
  textAlign: "center",
  color: "#334155",
};

const aiHeroStyle = {
  marginBottom: 16,
  padding: 16,
  borderRadius: 16,
  background: "linear-gradient(135deg, #111827, #1f2937)",
  color: "#fff",
};

const aiHeroTitleStyle = {
  fontWeight: 800,
  marginBottom: 8,
  fontSize: 18,
};

const aiHeroSubtitleStyle = {
  fontSize: 14,
  opacity: 0.92,
  marginBottom: 8,
};

const aiPoweredHintStyle = {
  fontSize: 13,
  opacity: 0.9,
};

const aiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "16px",
};

const aiMainCardStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
};

const aiSideCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "16px",
};

const aiCardTitleStyle = {
  fontWeight: 700,
  marginBottom: 10,
  color: "#111827",
};

const aiSectionStyle = {
  marginBottom: 12,
  color: "#334155",
  lineHeight: 1.7,
};

const aiButtonsRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: 10,
};

const aiScoreBox = (score = 0) => ({
  marginBottom: 14,
  background: score >= 80 ? "#dcfce7" : score >= 60 ? "#fef9c3" : "#fee2e2",
  color: score >= 80 ? "#166534" : score >= 60 ? "#854d0e" : "#991b1b",
  borderRadius: "12px",
  padding: "10px 12px",
  fontWeight: 700,
});

const recommendationItemStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "10px 12px",
  marginBottom: "8px",
  fontSize: "14px",
  lineHeight: 1.6,
  color: "#334155",
};

const mutedTextStyle = {
  color: "#64748b",
  fontSize: "14px",
};

const tagsWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px",
  marginTop: "10px",
};

const tagStyle = {
  background: "#22c55e",
  color: "#fff",
  padding: "4px 8px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
};
