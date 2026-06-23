import express from "express";
import supabase from "../db/postgres.js";

import { normalizeSearchText } from "../search/textNormalizer.js";
import { searchBusinesses } from "../search/searchService.js";
import { formatBusinessBlock } from "../search/searchFormatter.js";
import { findNearestBusinesses } from "../search/nearbyService.js";
import {
  parseSearchIntent,
  isGreetingMessage,
} from "../search/intentDetector.js";

import {
  javnaSendText,
  javnaSendImage,
  javnaSendCallToAction,
} from "../services/whatsapp/javnaClient.js";

import {
  understandConversationMessage,
  saveSearchSession,
  MESSAGE_TYPES,
} from "../services/conversationOrchestrator.js";

import { logOperationEvent } from "../middleware/operationLogger.js";
import { sendOpsAlert } from "../services/ops/sendOpsAlert.js";
import { createOrUpdateIncident } from "../services/ops/createOrUpdateIncident.js";
import { normalizeQueryForStorage } from "../utils/privacy.js";
import { createLeadToken } from "../services/pg/leadTokens.js";

const router = express.Router();

const PENDING_NEARBY_REQUESTS = new Map();

/* ------------------------------------------------------------------ */
/* WhatsApp Send Queue */
/* ------------------------------------------------------------------ */

const WHATSAPP_SEND_QUEUES = new Map();

async function runWhatsAppQueue(to, task) {
  const key = String(to || "");

  const previous =
    WHATSAPP_SEND_QUEUES.get(key) || Promise.resolve();

  const current = previous
    .catch(() => {})
    .then(task)
    .finally(() => {
      if (WHATSAPP_SEND_QUEUES.get(key) === current) {
        WHATSAPP_SEND_QUEUES.delete(key);
      }
    });

  WHATSAPP_SEND_QUEUES.set(key, current);

  return current;
}

function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

function detectLanguage(text = "") {
  return /[\u0600-\u06FF]/.test(String(text || "")) ? "ar" : "en";
}


function isHelpCommand(text = "") {
  return /^(help|start|مساعدة|ابدأ)$/i.test(String(text || "").trim());
}

function isThanks(text = "") {
  return /^(thanks|thank you|شكرا|شكرًا)$/i.test(String(text || "").trim());
}

function getWelcomeMessage(lang = "ar") {
  return lang === "ar"
    ? "مرحبًا بك في TrustedLinks 👋\n\nاكتب اسم شركة أو نوع نشاط للبحث.\n\nمثال:\n• مطعم\n• قهوة\n• صيدلية\n• أقرب مطعم"
    : "Welcome to TrustedLinks 👋\n\nType a business name or category to search.\n\nExample:\n• restaurant\n• coffee\n• pharmacy\n• nearest restaurant";
}

function normalizeNearbyText(text = "") {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNearbyIntent(text = "", session = {}) {
  const raw = String(text || "").trim();
  const q = normalizeNearbyText(raw);

  if (!q) {
    return { isNearby: false, categoryQuery: "", source: "empty" };
  }

  const nearbySignals = [
    "اقرب",
    "قريب",
    "قريبه",
    "قريب مني",
    "قريبه مني",
    "حولي",
    "حولينا",
    "جنب",
    "جنبي",
    "جنبنا",
    "بالقرب",
    "بالقرب مني",
    "وين اقرب",
    "هات الاقرب",
    "الاقرب",
    "داخل المول",
    "في المول",
    "near me",
    "nearest",
    "closest",
    "nearby",
    "around me",
    "close to me",
    "near",
    "in the mall",
    "inside mall",
    "inside the mall",
  ];

  const hasNearbySignal = nearbySignals.some((signal) =>
    q.includes(normalizeNearbyText(signal))
  );

  const isContextNearby =
    session?.state === "awaiting_refinement" &&
    ["قريب", "قريبه", "اقرب", "الاقرب", "near", "nearby", "nearest"].includes(q);

  if (!hasNearbySignal && !isContextNearby) {
    return { isNearby: false, categoryQuery: "", source: "none" };
  }

  let categoryQuery = q;

  const cleanupPatterns = [
    /وين اقرب/g,
    /هات الاقرب/g,
    /الاقرب/g,
    /اقرب/g,
    /قريب مني/g,
    /قريبه مني/g,
    /قريب/g,
    /قريبه/g,
    /مني/g,
    /حولي/g,
    /حولينا/g,
    /جنبنا/g,
    /جنبي/g,
    /جنب/g,
    /بالقرب مني/g,
    /بالقرب/g,
    /داخل المول/g,
    /في المول/g,
    /نفس المول/g,
    /near me/g,
    /nearest/g,
    /closest/g,
    /nearby/g,
    /around me/g,
    /around us/g,
    /close to me/g,
    /inside the mall/g,
    /inside mall/g,
    /in the mall/g,
    /near/g,
  ];

  cleanupPatterns.forEach((pattern) => {
    categoryQuery = categoryQuery.replace(pattern, " ");
  });

  categoryQuery = categoryQuery.replace(/\s+/g, " ").trim();

  if (!categoryQuery && session?.last_query) {
    categoryQuery = session.last_query;
  }

  return {
    isNearby: true,
    categoryQuery,
    source: isContextNearby ? "conversation_context" : "rules",
  };
}

function setPendingNearby(from, data = {}) {
  PENDING_NEARBY_REQUESTS.set(from, {
    category: data.category || "",
    rawQuery: data.rawQuery || "",
    createdAt: Date.now(),
  });
}

function getPendingNearby(from) {
  const item = PENDING_NEARBY_REQUESTS.get(from);
  if (!item) return null;

  if (Date.now() - item.createdAt > 10 * 60 * 1000) {
    PENDING_NEARBY_REQUESTS.delete(from);
    return null;
  }

  return item;
}

function clearPendingNearby(from) {
  PENDING_NEARBY_REQUESTS.delete(from);
}

function formatSingleRefinementQuestion(session) {
  const lang = session?.lang || "ar";

  return lang === "ar"
    ? "حتى أعطيك نتائج أدق، ماذا تفضل بالتحديد؟"
    : "To show better results, what exactly do you prefer?";
}

async function createLeadTrackedLink({
  businessId = "",
  phone = "",
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  const safePhone = String(phone || "").replace(/\D/g, "");
  const safeBusinessId = String(businessId || "").trim();
  const safeUserPhone = String(userPhone || "").replace(/\D/g, "");
  const safeQuery = String(query || "").trim();

  if (!safePhone || !safeBusinessId) return "";

  const token = await createLeadToken({
    businessId: safeBusinessId,
    businessPhone: safePhone,
    userPhone: safeUserPhone,
    query: safeQuery,
    intentType: intentType || "category",
  });

  const tokenId = token?.id || token?._id?.toString();
  const baseUrl = (process.env.FRONTEND_BASE_URL || "https://trustedlinks.net")
    .trim()
    .replace(/\/+$/, "");

  if (!tokenId) return "";

  return `${baseUrl}/l/${tokenId}`;
}

async function enrichTopResultWithTrackedLink({
  items = [],
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) return [];

  const enriched = [];

  for (const item of safeItems) {
    let trackedLink = "";

    try {
      if (item?.id && item?.whatsapp) {
        trackedLink = await createLeadTrackedLink({
          businessId: item.id,
          phone: item.whatsapp,
          query,
          userPhone,
          intentType,
        });
      }
    } catch (err) {
      console.error("TRACKED_LINK_CREATE_ERROR", {
        businessId: item?.id,
        error: err.message,
      });
    }

    enriched.push({
      ...item,
      trackedLink,
    });
  }

  return enriched;
}

async function enrichTopOnly({
  results = [],
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  if (!Array.isArray(results) || results.length === 0) return [];

  console.log("ENRICH_INTENT_DEBUG", {
    query,
    intentType,
    finalIntentType: intentType || "category",
    resultCount: results.length,
  });

  return enrichTopResultWithTrackedLink({
    items: results.slice(0, 3),
    query,
    userPhone,
    intentType: intentType || "category",
  });
}

function normalizeIntentType(intentData = {}, query = "") {
  if (intentData?.intent === "greeting") {
    return "greeting";
  }

  if (intentData?.isNearby) {
    return "nearby";
  }

  if (intentData?.intent === "brand" || intentData?.isBrandSearch === true) {
    return "direct";
  }

  if (intentData?.intent === "category") {
    return "category";
  }

  if (intentData?.intent === "discovery") {
    return "category";
  }

  return "category";
}

async function sendBusinessCards({
  to,
  results = [],
  lang = "ar",
  includeDistance = false,
}) {
  const safeResults = Array.isArray(results) ? results.slice(0, 3) : [];

  if (!safeResults.length) {
    await javnaSendText({
      to,
      body:
        lang === "ar"
          ? "لم أجد نتائج مناسبة. جرّب بحثًا آخر."
          : "No suitable results found. Try another search.",
    }).catch(console.error);

    return;
  }

  for (let i = 0; i < safeResults.length; i++) {
    const item = safeResults[i];

    const logoUrl =
      item.logo_url ||
      item.logoUrl ||
      item.logo;

    const caption = formatBusinessBlock(item, i, lang, {
      includeCategory: true,
      includeDistance,
      showLink: false,
      showDirections: false,
    });

    if (logoUrl && /^https?:\/\//i.test(logoUrl)) {
      await javnaSendImage({
        to,
        imageUrl: logoUrl,
        customId: item.custom_id || item.customId,
        caption,
      }).catch(console.error);
    } else {
      await javnaSendText({
        to,
        body: caption,
      }).catch(console.error);
    }
console.log("IMAGE_SENT", item.name || item.name_ar);
    await new Promise((r) => setTimeout(r, 1000));

    if (item.trackedLink) {
      await javnaSendCallToAction({
        to,
        body:
          lang === "ar"
            ? "تواصل مباشرة عبر واتساب"
            : "Contact directly via WhatsApp",
        buttonText: lang === "ar" ? "واتساب" : "WhatsApp",
        url: item.trackedLink,
      }).catch(console.error);
    }
console.log("WHATSAPP_SENT", item.name || item.name_ar);
    await new Promise((r) => setTimeout(r, 400));

    const mapsUrl =
      item.maps_url ||
      item.mapsUrl ||
      item.location_url ||
      item.locationUrl ||
      item.mapLink ||
      item.map_link;

    if (mapsUrl) {
      await javnaSendCallToAction({
        to,
        body:
          lang === "ar"
            ? "فتح الموقع والاتجاهات"
            : "Open location & directions",
        buttonText: lang === "ar" ? "الموقع" : "Location",
        url: mapsUrl,
      }).catch(console.error);
    }
console.log("LOCATION_SENT", item.name || item.name_ar);
    await new Promise((r) => setTimeout(r, 400));
  }
}

router.post("/", async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const body = req.body || {};

    if (body.eventScope !== "whatsapp" || body.event !== "wa.message.received") {
      return;
    }

    const from = cleanDigits(body.from || body?.data?.from || "");
    if (!from) return;

    const messageType = body?.data?.type || "";
    const incomingLocation = body?.data?.location || null;
    const incomingText = String(
      body?.data?.text?.text ||
      body?.data?.text ||
      ""
    ).trim();

    const lang = detectLanguage(incomingText);
    const normalizedQuery = normalizeSearchText(incomingText);

    const conversationDecision = await understandConversationMessage({
      userPhone: from,
      message: incomingText,
    });

    console.log("CONVERSATION_DECISION_DEBUG", {
      message: incomingText,
      messageType: conversationDecision.messageType,
      action: conversationDecision.action,
    });

    if (
      messageType === "text" &&
      (isGreetingMessage(incomingText) || isHelpCommand(incomingText))
    ) {
      return javnaSendText({
        to: from,
        body: getWelcomeMessage(lang),
      }).catch(console.error);
    }
    
    if (messageType === "text" && isThanks(incomingText)) {
      return javnaSendText({
        to: from,
        body: lang === "ar" ? "على الرحب والسعة 😊" : "You're welcome 😊",
      }).catch(console.error);
    }

    if (
      messageType === "location" &&
      incomingLocation?.latitude &&
      incomingLocation?.longitude
    ) {
      const lat = Number(incomingLocation.latitude);
      const lng = Number(incomingLocation.longitude);

      const pendingNearby = getPendingNearby(from);
      const categoryQuery = pendingNearby?.category || "";

      const nearestResults = await findNearestBusinesses(
        lat,
        lng,
        3,
        categoryQuery
      );

      const enrichedResults = await enrichTopOnly({
        results: nearestResults || [],
        query: categoryQuery || pendingNearby?.rawQuery || "",
        userPhone: from,
        intentType: "nearby",
      });

      clearPendingNearby(from);

   await runWhatsAppQueue(from, () =>
  sendBusinessCards({
    to: from,
    results: enrichedResults,
    lang,
    includeDistance: true,
  })
);

      return;
    }

    if (!normalizedQuery) {
      return javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "اكتب اسم شركة أو نوع نشاط."
            : "Send a business name or category.",
      }).catch(console.error);
    }

    if (conversationDecision.messageType === MESSAGE_TYPES.RESULT_SELECTION) {
      const selected = conversationDecision.payload?.result;

      if (selected?.trackedLink) {
        return javnaSendText({
          to: from,
          body:
            lang === "ar"
              ? `تفضل رابط التواصل:\n${selected.trackedLink}`
              : `Here is the business link:\n${selected.trackedLink}`,
        }).catch(console.error);
      }
    }

    if (conversationDecision.messageType === MESSAGE_TYPES.RESET) {
      return javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "تم بدء بحث جديد، ماذا تبحث عنه؟"
            : "Started a new search. What are you looking for?",
      }).catch(console.error);
    }

    if (conversationDecision.messageType === MESSAGE_TYPES.REFINEMENT_ANSWER) {
      const lastQuery =
        conversationDecision.session?.last_query ||
        conversationDecision.session?.lastQuery ||
        "";

      const answerValue = conversationDecision.payload?.value || "";

      const ignoredAnswers = [
        "اي شي",
        "أي شي",
        "اي شيء",
        "أي شيء",
        "مش مهم",
        "عادي",
        "نعم",
        "yes",
        "anything",
      ];

      const normalizedAnswer = normalizeSearchText(answerValue);

      const refinedQuery = ignoredAnswers
        .map((x) => normalizeSearchText(x))
        .includes(normalizedAnswer)
        ? lastQuery
        : `${lastQuery} ${answerValue}`.trim();

      const refinedIntentData = parseSearchIntent(refinedQuery);
      const refinedEffectiveQuery =
        refinedIntentData.categoryQuery || normalizeSearchText(refinedQuery);

      const refinedIntentType = normalizeIntentType(
        refinedIntentData,
        refinedQuery
      );

      const searchData = await searchBusinesses({
        query: refinedEffectiveQuery,
        lang,
        intentType: refinedIntentType,
        isNearby: refinedIntentData?.isNearby || false,
      });

      const enrichedResults = await enrichTopOnly({
        results: searchData.results || [],
        query: refinedEffectiveQuery,
        userPhone: from,
        intentType: refinedIntentType,
      });

      await saveSearchSession({
        userPhone: from,
        query: refinedEffectiveQuery,
        intentType: refinedIntentType,
        results: enrichedResults,
        needsRefinement: false,
      });

    await runWhatsAppQueue(from, () =>
  sendBusinessCards({
    to: from,
    results: enrichedResults,
    lang,
    includeDistance: false,
  })
);

      return;
    }

    const nearbyIntent = parseNearbyIntent(
      incomingText,
      conversationDecision.session
    );

    if (nearbyIntent.isNearby) {
      setPendingNearby(from, {
        category: nearbyIntent.categoryQuery || "",
        rawQuery: incomingText,
      });

      return javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "📍 أرسل موقعك الحالي لأعرض لك أقرب النتائج."
            : "📍 Please share your location so I can show nearest results.",
      }).catch(console.error);
    }

    const effectiveIncomingText =
      conversationDecision.payload?.query || incomingText;

    const intentData = parseSearchIntent(effectiveIncomingText);
    const effectiveQuery =
      intentData.categoryQuery || normalizeSearchText(effectiveIncomingText);

  if (intentData.intent === "greeting") {
  return javnaSendText({
    to: from,
    body: getWelcomeMessage(lang),
  }).catch(console.error);
}

 let intentType = normalizeIntentType(intentData, incomingText);

if (intentData?.intent === "category") {
  intentType = "category";
}

if (intentData?.intent === "discovery") {
  intentType = "category";
}

if (intentData?.intent === "brand") {
  intentType = "direct";
}

    console.log("INTENT_DEBUG", {
      query: incomingText,
      effectiveQuery,
      intentData,
      intentType,
    });

    const searchTimerId = `SEARCH_TOTAL_${Date.now()}_${Math.random()}`;
    const searchStart = Date.now();

    console.time(searchTimerId);

    const searchData = await searchBusinesses({
      query: effectiveQuery,
      lang,
      intentType,
      isNearby: nearbyIntent?.isNearby || false,
    });

    console.timeEnd(searchTimerId);

    const durationMs = Date.now() - searchStart;

    if (durationMs > 3000) {
      await logOperationEvent({
        type: "performance",
        level: "warning",
        source: "search",
        action: "search_businesses",
        status: "slow",
        message: `Search took ${durationMs}ms`,
        meta: {
          durationMs,
          intentType,
          isNearby: nearbyIntent?.isNearby || false,
          query: normalizeQueryForStorage(effectiveQuery),
        },
      });

      await createOrUpdateIncident({
        incidentKey: "slow_search",
        title: "Search latency increased",
        type: "performance",
        severity: "warning",
        source: "search",
        meta: {
          durationMs,
          intentType,
        },
      });

      await sendOpsAlert({
        subject: "Slow Search Detected",
        severity: "warning",
        message: `Search latency reached ${durationMs}ms`,
        meta: {
          query: normalizeQueryForStorage(effectiveQuery),
          durationMs,
          intentType,
        },
      });
    }

    console.log("SEARCH_RESULT_DEBUG", {
      query: effectiveQuery,
      mode: searchData?.mode,
      totalMatched: searchData?.totalMatched,
      resultCount: searchData?.results?.length,
      firstResult:
        searchData?.results?.[0]?.name ||
        searchData?.results?.[0]?.name_ar ||
        null,
    });

    if (
      searchData?.mode === "results" &&
      Number(searchData?.totalMatched || 0) === 0
    ) {
      try {
        await supabase.from("search_no_results").insert({
          query: incomingText,
          normalized_query: normalizeSearchText(incomingText),
          lang,
          intent: intentType,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error("NO_RESULT_LOG_ERROR", err);
      }
    }

    if (searchData.mode === "refinement_required") {
      await saveSearchSession({
        userPhone: from,
        query: effectiveQuery,
        intentType,
        results: searchData.results || [],
        needsRefinement: true,
      });

      return javnaSendText({
        to: from,
        body: formatSingleRefinementQuestion({
          query: effectiveQuery,
          lang,
          step: 0,
        }),
      }).catch(console.error);
    }

    const enrichedResults = await enrichTopOnly({
      results: searchData.results || [],
      query: searchData.effectiveQuery || effectiveQuery,
      userPhone: from,
      intentType,
    });

    await saveSearchSession({
      userPhone: from,
      query: effectiveQuery,
      intentType,
      results: enrichedResults,
      needsRefinement: false,
    });

await runWhatsAppQueue(from, () =>
  sendBusinessCards({
    to: from,
    results: enrichedResults,
    lang,
    includeDistance: false,
  })
);

    return;
  } catch (e) {
    console.error("WHATSAPP WEBHOOK ERROR:", e);
  }
});

export default router;
