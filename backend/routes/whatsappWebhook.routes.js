import express from "express";
import supabase from "../db/postgres.js";

import { normalizeSearchText } from "../search/textNormalizer.js";
import { searchBusinesses } from "../search/searchService.js";
import {
  formatSearchResponse,
  formatNearestResults,
  formatBusinessBlock,
} from "../search/searchFormatter.js";
import { findNearestBusinesses } from "../search/nearbyService.js";
import { parseSearchIntent } from "../search/intentDetector.js";

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

import {
  logOperationEvent,
} from "../middleware/operationLogger.js";

import { sendOpsAlert } from "../services/ops/sendOpsAlert.js";
import { createOrUpdateIncident } from "../services/ops/createOrUpdateIncident.js";

import { normalizeQueryForStorage } from "../utils/privacy.js";
import { createLeadToken } from "../services/pg/leadTokens.js";

const router = express.Router();


// ============================================================================
// WhatsApp Helpers - Compact Production Version
// ============================================================================

function detectLanguage(text = "") {
  return /[\u0600-\u06FF]/.test(String(text || "")) ? "ar" : "en";
}

function isGreeting(text = "") {
  return /^(hi|hello|hey|مرحبا|اهلا|أهلا|هلا|سلام)$/i.test(
    String(text || "").trim()
  );
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
    "ناحيتي",
    "بجانبي",
    "وين اقرب",
    "هات الاقرب",
    "الاقرب",
    "في المنطقه",
    "بالمنطقه",
    "داخل المول",
    "في المول",
    "نفس المول",
    "near me",
    "nearest",
    "closest",
    "nearby",
    "around me",
    "around us",
    "close to me",
    "near",
    "in the mall",
    "inside mall",
    "inside the mall",
  ];

  const contextualNearbyAnswers = [
    "قريب",
    "قريبه",
    "اقرب",
    "الاقرب",
    "حولي",
    "حولينا",
    "جنبنا",
    "جنب",
    "داخل المول",
    "في المول",
    "near",
    "nearby",
    "nearest",
    "closest",
  ];

  const hasNearbySignal = nearbySignals.some((signal) =>
    q.includes(normalizeNearbyText(signal))
  );

  const isContextNearby =
    session?.state === "awaiting_refinement" &&
    contextualNearbyAnswers.includes(q);

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
    /ناحيتي/g,
    /بجانبي/g,
    /في المنطقه/g,
    /بالمنطقه/g,
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


// ============================================================================
// WhatsApp Webhook - Production Fast Version
// ============================================================================

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
    const incomingText = String(body?.data?.text?.text || body?.data?.text || "").trim();


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

    // Greeting / Help
    if (messageType === "text" && (isGreeting(incomingText) || isHelpCommand(incomingText))) {
      return javnaSendText({
        to: from,
        body: getWelcomeMessage(lang),
      }).catch(console.error);
    }

    // Thanks
    if (messageType === "text" && isThanks(incomingText)) {
      return javnaSendText({
        to: from,
        body: lang === "ar" ? "على الرحب والسعة 😊" : "You're welcome 😊",
      }).catch(console.error);
    }

    // Location Search
    if (
      messageType === "location" &&
      incomingLocation?.latitude &&
      incomingLocation?.longitude
    ) {
      const lat = Number(incomingLocation.latitude);
      const lng = Number(incomingLocation.longitude);

      const pendingNearby = getPendingNearby(from);
      const categoryQuery = pendingNearby?.category || "";

      const nearestResults = await findNearestBusinesses(lat, lng, 3, categoryQuery);

      const enrichedResults = await enrichTopOnly({
        results: nearestResults || [],
        query: categoryQuery || pendingNearby?.rawQuery || "",
        userPhone: from,
        intentType: "nearby",
      });

      clearPendingNearby(from);

      const reply = formatNearestResults(
        enrichedResults,
        lang,
        categoryQuery || pendingNearby?.rawQuery || ""
      );

      return javnaSendText({
        to: from,
        body: reply,
      }).catch(console.error);
    }

    // Empty Text
    if (!normalizedQuery) {
      return javnaSendText({
        to: from,
        body:
          lang === "ar"
            ? "اكتب اسم شركة أو نوع نشاط."
            : "Send a business name or category.",
      }).catch(console.error);
    }

    // Conversation Result Selection
if (
  conversationDecision.messageType ===
  MESSAGE_TYPES.RESULT_SELECTION
) {
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

// Reset Conversation
if (
  conversationDecision.messageType ===
  MESSAGE_TYPES.RESET
) {
  return javnaSendText({
    to: from,
    body:
      lang === "ar"
        ? "تم بدء بحث جديد، ماذا تبحث عنه؟"
        : "Started a new search. What are you looking for?",
  }).catch(console.error);
}

// Refinement Answer
if (
  conversationDecision.messageType ===
  MESSAGE_TYPES.REFINEMENT_ANSWER
) {
  console.log("REFINEMENT_ANSWER_DEBUG", {
    payload: conversationDecision.payload,
  });

  const lastQuery =
    conversationDecision.session?.last_query ||
    conversationDecision.session?.lastQuery ||
    "";

  const answerValue =
    conversationDecision.payload?.value || "";

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
    refinedIntentData.categoryQuery ||
    normalizeSearchText(refinedQuery);

  const refinedIntentType = normalizeIntentType(
    refinedIntentData,
    refinedQuery
  );

  console.log("REFINEMENT_APPLY_DEBUG", {
    lastQuery,
    answerValue,
    refinedQuery,
    refinedEffectiveQuery,
    refinedIntentType,
  });

const searchData = await searchBusinesses({
  query: refinedEffectiveQuery,
  lang,
  intentType: refinedIntentType,
  isNearby: refinedIntentData?.isNearby || false,
});

  if (
    !searchData?.results ||
    searchData.results.length === 0
  ) {
    return javnaSendText({
      to: from,
      body:
        lang === "ar"
          ? "لم أجد نتائج مناسبة لهذا التفضيل. جرّب وصفًا آخر أو اكتب بحثًا جديدًا."
          : "I couldn’t find suitable results for that preference. Try another description or start a new search.",
    }).catch(console.error);
  }

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

  const reply = formatSearchResponse(
    {
      ...searchData,
      mode: "results",
      results: enrichedResults,
    },
    lang
  );

  return javnaSendText({
    to: from,
    body: reply,
  }).catch(console.error);
}
    // Nearby Intent
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

    // Normal Intent
   const effectiveIncomingText =
  conversationDecision.payload?.query || incomingText;

const intentData = parseSearchIntent(
  effectiveIncomingText
);
    
const effectiveQuery =
  intentData.categoryQuery ||
  normalizeSearchText(effectiveIncomingText);
    
const intentType = normalizeIntentType(intentData, incomingText);

console.log("INTENT_DEBUG", {
  query: incomingText,
  effectiveQuery,
  intentData,
  intentType,
});

 // Search Fast - TEMP PERFORMANCE TEST
const t0 = Date.now();

const searchTimerId = `SEARCH_TOTAL_${Date.now()}_${Math.random()}`;
console.time(searchTimerId);

console.time("searchBusinessesFast");

const searchStart = Date.now();

const searchData = await searchBusinesses({
  query: effectiveQuery,
  lang,
  intentType,
  isNearby: nearbyIntent?.isNearby || false,
});

const durationMs = Date.now() - searchStart;

console.timeEnd("searchBusinessesFast");

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

// Learn failed searches
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

// Refinement
if (searchData.mode === "refinement_required") {
  console.timeEnd(searchTimerId);
  console.log("TOTAL USER REPLY TIME:", Date.now() - t0, "ms");

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
      answers: {
        preference: "",
        area: "",
        priority: "",
      },
      step: 0,
    }),
  }).catch(console.error);
}
    
const enrichTimer = `enrichTopOnly_${Date.now()}_${Math.random()}`;
console.time(enrichTimer);

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
  needsRefinement:
    searchData?.mode === "refinement_required",
});

const imageCardResults = enrichedResults.filter((item) => {
  const logoUrl =
    item.logo_url ||
    item.logoUrl ||
    item.logo;

  return logoUrl && /^https?:\/\//i.test(logoUrl);
});

const useImageCards =
  imageCardResults.length > 0 &&
  enrichedResults.length <= 3;

if (useImageCards) {

  for (let i = 0; i < enrichedResults.length; i++) {
    const item = enrichedResults[i];

    const logoUrl =
      item.logo_url ||
      item.logoUrl ||
      item.logo;

    const caption = formatBusinessBlock(item, i, lang, {
      includeCategory: true,
      includeDistance: false,
      showLink: false,
      showDirections: false,
    });

    if (!logoUrl || !/^https?:\/\//i.test(logoUrl)) {
      await javnaSendText({
        to: from,
        body: caption,
      }).catch(console.error);

      continue;
    }

await javnaSendImage({
  to: from,
  imageUrl: logoUrl,
  customId:
    item.custom_id ||
    item.customId,
  caption,
});

await new Promise((resolve) => setTimeout(resolve, 1200));
     
      
await new Promise((r) => setTimeout(r, 500));

if (item.trackedLink) {
  await javnaSendCallToAction({
    to: from,
    body:
      lang === "ar"
        ? "تواصل مباشرة عبر واتساب"
        : "Contact directly via WhatsApp",

    buttonText:
      lang === "ar"
        ? "واتساب"
        : "WhatsApp",

    url: item.trackedLink,
  }).catch((err) => {
    console.error("JAVNA_CTA_ERROR:", err);
  });
}

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
    to: from,
    body:
      lang === "ar"
        ? "فتح الموقع والاتجاهات"
        : "Open location & directions",

    buttonText:
      lang === "ar"
        ? "الموقع"
        : "Location",

    url: mapsUrl,
  }).catch((err) => {
    console.error("JAVNA_MAP_CTA_ERROR:", err);
  });
}

        }

  return;
}
      
console.timeEnd(enrichTimer);
      
const formatTimer =
  `formatSearchResponse_${Date.now()}_${Math.random()}`;

console.time(formatTimer);

const reply = formatSearchResponse(
  {
    ...searchData,
    results: enrichedResults,
  },
  lang
);

console.timeEnd(formatTimer);

javnaSendText({
  to: from,
  body: reply,
}).catch((err) => {
  console.error("JAVNA SEND ERROR:", err);
});

return;

  } catch (e) {
    console.error("WHATSAPP WEBHOOK ERROR:", e);
  }
});
export default router;
