// ---------------------------------------------------------------------------
// JAVNA Config
// ---------------------------------------------------------------------------
import { logOperationEvent } from "../../middleware/operationLogger.js";

const JAVNA_API_KEY = (process.env.JAVNA_API_KEY || "").trim();
const JAVNA_FROM = (process.env.JAVNA_FROM || "").trim();
const JAVNA_BASE_URL = "https://whatsapp.api.javna.com/whatsapp/v1.0";
const JAVNA_SEND_TEXT_URL = `${JAVNA_BASE_URL}/message/text`;
const JAVNA_SEND_AUTH_TEMPLATE_URL = `${JAVNA_BASE_URL}/message/template/authentication`;
const JAVNA_SEND_IMAGE_URL =  `${JAVNA_BASE_URL}/message/image`;
const JAVNA_SEND_CTA_URL =
  `${JAVNA_BASE_URL}/message/interactive/callToAction`;

const FRONTEND_BASE_URL =
  process.env.FRONTEND_BASE_URL ||
  "https://trustedlinks.net";

async function javnaSendImage({
  to,
  customId,
  caption = "",
}) {
  if (!JAVNA_API_KEY) {
    throw new Error("Missing JAVNA_API_KEY");
  }

  if (!JAVNA_FROM) {
    throw new Error("Missing JAVNA_FROM");
  }

if (!customId) {
  console.log("MISSING_CUSTOM_ID_FOR_IMAGE", { customId });
  return javnaSendText({
    to,
    body: caption,
  });
}
  
  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": JAVNA_API_KEY,
  };

  const from = JAVNA_FROM.startsWith("+")
    ? JAVNA_FROM
    : `+${JAVNA_FROM}`;

  const toNumber = String(to || "").startsWith("+")
    ? String(to)
    : `+${to}`;

  const imageUrl =
    `${FRONTEND_BASE_URL}/media/logo/${customId}`;

  const payload = {
    from,
    to: toNumber,
   content: {
  mediaUrl: imageUrl,
  caption: String(caption || " "),
    },
  };

  const r = await fetch(
    JAVNA_SEND_IMAGE_URL,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );

  const txt = await r.text();

if (!r.ok) {

  await logOperationEvent({
    type: "whatsapp",
    level: "error",
    source: "javna",
    action: "send_image",
    status: "failed",
    message: `Javna image failed (${r.status})`,
    meta: {
      statusCode: r.status,
    },
  });

  throw new Error(
    `Javna image send failed (${r.status}): ${txt}`
  );
}

  try {
    return JSON.parse(txt);
  } catch {
    return { ok: true, raw: txt };
  }
}

async function javnaSendText({ to, body }) {
  if (!JAVNA_API_KEY) throw new Error("Missing JAVNA_API_KEY");
  if (!JAVNA_FROM) throw new Error("Missing JAVNA_FROM");

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": JAVNA_API_KEY,
  };

  const from = JAVNA_FROM.startsWith("+") ? JAVNA_FROM : `+${JAVNA_FROM}`;
  const toNumber = String(to || "").startsWith("+") ? String(to) : `+${to}`;

  const payload = {
    from,
    to: toNumber,
    content: {
      text: String(body || ""),
    },
  };

  const r = await fetch(JAVNA_SEND_TEXT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text();

 if (!r.ok) {

  await logOperationEvent({
    type: "whatsapp",
    level: "error",
    source: "javna",
    action: "send_text",
    status: "failed",
    message: `Javna send failed (${r.status})`,
    meta: {
      statusCode: r.status,
    },
  });

  throw new Error(`Javna send failed (${r.status}): ${txt}`);
}
  try {
    return JSON.parse(txt);
  } catch {
    return { ok: true, raw: txt };
  }
}


async function javnaSendOtpTemplate({
  to,
  code,
  lang = "en",
}) {

  if (!JAVNA_API_KEY) {
    throw new Error("Missing JAVNA_API_KEY");
  }

  if (!JAVNA_FROM) {
    throw new Error("Missing JAVNA_FROM");
  }

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": JAVNA_API_KEY,
  };

  const from = JAVNA_FROM.startsWith("+")
    ? JAVNA_FROM
    : `+${JAVNA_FROM}`;

  const toNumber = String(to || "").startsWith("+")
    ? String(to)
    : `+${to}`;

  const templateName =
    lang === "ar"
      ? "turstedlinks_otp_ar"
      : "trustedlinks_otp_en";

  const templateLanguage =
    lang === "ar"
      ? "ar"
      : "en";

  const payload = {
    from,
    to: toNumber,
    content: {
      templateName,
      templateLanguage,
      otp: String(code),
    },
  };

  const r = await fetch(
    JAVNA_SEND_AUTH_TEMPLATE_URL,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );

  const txt = await r.text();

 if (!r.ok) {

  await logOperationEvent({
    type: "whatsapp",
    level: "error",
    source: "javna",
    action: "send_otp_template",
    status: "failed",
    message: `OTP template failed (${r.status})`,
    meta: {
      statusCode: r.status,
    },
  });

  throw new Error(
    `Javna auth template failed (${r.status}): ${txt}`
  );
}

  return JSON.parse(txt);
}



async function javnaSendCallToAction({
  to,
  body,
  buttonText,
  url,
}) {
  if (!JAVNA_API_KEY) {
    throw new Error("Missing JAVNA_API_KEY");
  }

  if (!JAVNA_FROM) {
    throw new Error("Missing JAVNA_FROM");
  }

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": JAVNA_API_KEY,
  };

  const from = JAVNA_FROM.startsWith("+")
    ? JAVNA_FROM
    : `+${JAVNA_FROM}`;

  const toNumber = String(to || "").startsWith("+")
    ? String(to)
    : `+${to}`;

  const payload = {
    from,
    to: toNumber,
    content: {
      bodyText: String(body || ""),
      displayText: String(buttonText || ""),
      url: String(url || ""),
    },
  };

  const r = await fetch(JAVNA_SEND_CTA_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const txt = await r.text();

if (!r.ok) {
  await logOperationEvent({
    type: "whatsapp",
    level: "error",
    source: "javna",
    action: "send_cta",
    status: "failed",
    message: `CTA failed (${r.status})`,
    meta: {
      statusCode: r.status,
    },
  });

  throw new Error(
    `Javna CTA failed (${r.status}): ${txt}`
  );
}

try {
  return JSON.parse(txt);
} catch {
  return {
    ok: true,
    raw: txt,
  };
}
}

export {
  javnaSendText,
  javnaSendImage,
  javnaSendOtpTemplate,
  javnaSendCallToAction,
};
