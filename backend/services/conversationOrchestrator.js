import {
  getConversationSession,
  upsertConversationSession,
  clearConversationSession,
} from "./pg/conversationSessions.js";

export const MESSAGE_TYPES = {
  NEW_SEARCH: "new_search",
  REFINEMENT_ANSWER: "refinement_answer",
  RESULT_SELECTION: "result_selection",
  RESET: "reset",
  UNKNOWN: "unknown",
};

function normalizeText(text = "") {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

function detectReset(text = "") {
  const q = normalizeText(text);

  return [
    "الغاء",
    "الغاء البحث",
    "بحث جديد",
    "ابدا من جديد",
    "جديد",
    "reset",
    "new search",
    "start over",
  ].includes(q);
}

function normalizeDigits(text = "") {
  return String(text || "")
    .replace(/[٠۰]/g, "0")
    .replace(/[١۱]/g, "1")
    .replace(/[٢۲]/g, "2")
    .replace(/[٣۳]/g, "3")
    .replace(/[٤۴]/g, "4")
    .replace(/[٥۵]/g, "5")
    .replace(/[٦۶]/g, "6")
    .replace(/[٧۷]/g, "7")
    .replace(/[٨۸]/g, "8")
    .replace(/[٩۹]/g, "9");
}

function detectResultSelection(text = "") {
  const q = normalizeDigits(normalizeText(text));

  const map = {
    "1": 0,
    "الاول": 0,
    "اول": 0,
    "افتح الاول": 0,

    "2": 1,
    "الثاني": 1,
    "تاني": 1,
    "افتح الثاني": 1,

    "3": 2,
    "الثالث": 2,
    "افتح الثالث": 2,

    "4": 3,
    "الرابع": 3,
    "افتح الرابع": 3,
  };

  if (map[q] !== undefined) {
    return {
      selectedIndex: map[q],
    };
  }

  return null;
}
function detectRefinementAnswer(text = "", session = {}) {
  const q = normalizeText(text);

  if (!session?.pending_question) return null;

  if (session.pending_question === "category_refinement") {
    return {
      refinementType: "category_refinement",
      value: q,
    };
  }

  if (session.pending_question === "location_preference") {
    if (
      q.includes("قريب") ||
      q.includes("قريبه") ||
      q.includes("حولي") ||
      q.includes("near")
    ) {
      return {
        refinementType: "location_preference",
        value: "nearby",
      };
    }

    if (
      q.includes("داخل") ||
      q.includes("المول") ||
      q.includes("mall")
    ) {
      return {
        refinementType: "location_preference",
        value: "inside_mall",
      };
    }

    return {
      refinementType: "location_preference",
      value: q,
    };
  }

  return {
    refinementType: session.pending_question,
    value: q,
  };
}

export async function understandConversationMessage({
  userPhone,
  message,
}) {
  const text = String(message || "").trim();

  const session = await getConversationSession(userPhone);

  if (!text) {
    return {
      messageType: MESSAGE_TYPES.UNKNOWN,
      action: "ignore",
      session,
      payload: {},
    };
  }

  if (detectReset(text)) {
    await clearConversationSession(userPhone);

    return {
      messageType: MESSAGE_TYPES.RESET,
      action: "start_new",
      session: null,
      payload: {},
    };
  }

  function looksLikeNewSearch(text = "", session = {}) {
  const q = normalizeText(text);
  const lastQuery = normalizeText(session?.last_query || session?.lastQuery || "");

  if (!q) return false;

  if (lastQuery && q === lastQuery) return true;

  const strongSearchWords = [
    "مطعم",
    "خدمات",
    "صيدليه",
    "قهوه",
    "كافيه",
    "شاورما",
    "برجر",
    "بيتزا",
    "حلويات",
    "ملابس",
    "عطور",
    "صالون",
    "عياده",
    "مخبز",
    "restaurant",
    "services",
    "pharmacy",
    "coffee",
    "cafe",
    "burger",
    "pizza",
  ];

  return strongSearchWords.includes(q);
}
 if (
  session?.state === "awaiting_refinement" &&
  !looksLikeNewSearch(text, session)
) {
  const refinement = detectRefinementAnswer(text, session);

  if (refinement) {
    return {
      messageType: MESSAGE_TYPES.REFINEMENT_ANSWER,
      action: "apply_refinement",
      session,
      payload: refinement,
    };
  }
}
  console.log("SESSION_RESULTS_DEBUG", {
  hasSession: !!session,
  state: session?.state,
  lastResultsCount: session?.last_results?.length || 0,
});
  
  if (session?.last_results?.length) {
    const selection = detectResultSelection(text);

    if (
      selection &&
      session.last_results[selection.selectedIndex]
    ) {
      return {
        messageType: MESSAGE_TYPES.RESULT_SELECTION,
        action: "open_result",
        session,
        payload: {
          selectedIndex: selection.selectedIndex,
          result: session.last_results[selection.selectedIndex],
        },
      };
    }
  }

  return {
    messageType: MESSAGE_TYPES.NEW_SEARCH,
    action: "search",
    session,
    payload: {
      query: text,
    },
  };
}

export async function saveSearchSession({
  userPhone,
  query,
  intentType,
  results = [],
  needsRefinement = false,
}) {
  const safeResults = Array.isArray(results)
    ? results.slice(0, 5).map((r) => ({
        id: r.id,
        name: r.name,
        name_ar: r.name_ar,
        trackedLink: r.trackedLink,
      }))
    : [];

  return upsertConversationSession(userPhone, {
    state: needsRefinement ? "awaiting_refinement" : "idle",
    lastIntent: intentType,
    lastQuery: query,
    pendingAction: needsRefinement ? "refine_search" : null,
    pendingQuestion: needsRefinement ? "category_refinement" : null,
    lastResults: safeResults,
    context: {
      needsRefinement,
    },
  });
}
