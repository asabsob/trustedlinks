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

async function enrichTopResultWithTrackedLink({
  items = [],
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  const finalIntentType = intentType || "category";
  const safeItems = Array.isArray(items) ? items : [];

  if (!safeItems.length) return [];

  const enriched = [];

  for (const item of safeItems) {
    let trackedLink = null;

    try {
      if (item?.id && item?.whatsapp) {
        trackedLink = await createLeadTrackedLink({
          businessId: item.id,
          phone: item.whatsapp,
          query,
          userPhone,
          intentType: finalIntentType,
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

// =========================
// MEMORY (instead of Mongo sessions)
// =========================
const PENDING_NEARBY_REQUESTS = new Map();
const PENDING_REFINEMENT_REQUESTS = new Map();

// =========================
// HELPERS
// =========================

function cleanDigits(v = "") {
  return String(v).replace(/\D/g, "");
}

// =========================
// NEARBY MEMORY (NO MONGO)
// =========================

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

// =========================
// REFINEMENT MEMORY
// =========================

function getRefinementQuestions(lang = "ar") {
  return [
    {
      key: "preference",
      text:
        lang === "ar"
          ? "ماذا تفضل بالتحديد؟"
          : "What exactly do you prefer?",
    },
    {
      key: "area",
      text:
        lang === "ar"
          ? "في أي منطقة؟"
          : "Which area?",
    },
    {
      key: "priority",
      text:
        lang === "ar"
          ? "هل تريد خيارًا اقتصاديًا أم الأفضل تقييمًا؟"
          : "Do you want a budget option or top-rated?",
    },
  ];
}

function setPendingRefinement(from, data = {}) {
  PENDING_REFINEMENT_REQUESTS.set(from, {
    query: data.query || "",
    lang: data.lang || "ar",
    answers: {
      preference: data.answers?.preference || "",
      area: data.answers?.area || "",
      priority: data.answers?.priority || "",
    },
    step: Number(data.step || 0),
    createdAt: Date.now(),
  });
}

function getPendingRefinement(from) {
  const item = PENDING_REFINEMENT_REQUESTS.get(from);
  if (!item) return null;

  if (Date.now() - item.createdAt > 15 * 60 * 1000) {
    PENDING_REFINEMENT_REQUESTS.delete(from);
    return null;
  }

  return item;
}

function clearPendingRefinement(from) {
  PENDING_REFINEMENT_REQUESTS.delete(from);
}

function getCurrentRefinementQuestion(session) {
  if (!session) return null;

  const questions = getRefinementQuestions(session.lang || "ar");
  return questions[session.step] || null;
}

function saveRefinementAnswer(session, answer = "") {
  if (!session) return null;

  const questions = getRefinementQuestions(session.lang || "ar");
  const currentQuestion = questions[session.step];

  if (!currentQuestion) return session;

  const cleanAnswer = String(answer || "").trim();

  const nextAnswers = {
    ...session.answers,
    [currentQuestion.key]: cleanAnswer,
  };

  return {
    ...session,
    answers: nextAnswers,
    step: session.step + 1,
    createdAt: Date.now(),
  };
}

function isRefinementComplete(session) {
  if (!session) return false;
  return (
    String(session.answers?.preference || "").trim() &&
    String(session.answers?.area || "").trim() &&
    String(session.answers?.priority || "").trim()
  );
}

function formatSingleRefinementQuestion(session) {
  const question = getCurrentRefinementQuestion(session);
  const lang = session?.lang || "ar";

  if (!question) {
    return lang === "ar"
      ? "شكرًا، سأعرض لك النتائج الآن."
      : "Thanks, I’ll show you the results now.";
  }

  return `${session.step + 1}) ${question.text}`;
}

async function createLeadTrackedLink({
  businessId = "",
  phone = "",
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  const finalIntentType = intentType || "category";

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
    intentType: finalIntentType,
  });

  const tokenId = token?.id || token?._id?.toString();
  const baseUrl = (process.env.FRONTEND_BASE_URL || "https://trustedlinks.net")
    .trim()
    .replace(/\/+$/, "");

  if (!tokenId || !baseUrl) {
    console.error("Failed to create tracked link", {
      hasToken: !!token,
      tokenId,
      baseUrl,
      businessId: safeBusinessId,
    });
    return "";
  }

  return `${baseUrl}/l/${tokenId}`;
}

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

async function enrichTopOnly({
  results = [],
  query = "",
  userPhone = "",
  intentType = "category",
}) {
  if (!Array.isArray(results) || results.length === 0) return [];

  const finalIntentType = intentType || "category";

  console.log("ENRICH_INTENT_DEBUG", {
    query,
    intentType,
    finalIntentType,
    resultCount: results.length,
  });

  const resultsToEnrich = results.slice(0, 4);

  const enrichedResults = await enrichTopResultWithTrackedLink({
    items: resultsToEnrich,
    query,
    userPhone,
    intentType: finalIntentType,
  });

  return enrichedResults;
}

function normalizeIntentType(intentData = {}, query = "") {
  const q = String(query || "").trim().toLowerCase();

  // nearby intent
  if (
    intentData?.isNearby ||
    intentData?.intent === "nearby" ||
    q.includes("near me") ||
    q.includes("قريب") ||
    q.includes("قريبة") ||
    q.includes("حولي") ||
    q.includes("جنب")
  ) {
    return "nearby";
  }

  // direct business / brand search
  if (
    intentData?.intent === "brand" ||
    intentData?.isBrandSearch === true
  ) {
    return "direct";
  }

  // category search
  if (intentData?.intent === "category") {
    return "category";
  }

  // smart fallback
  if (q.split(" ").length <= 2) {
    return "direct";
  }

  return "category";
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
