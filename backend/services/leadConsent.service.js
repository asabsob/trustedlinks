export function renderLeadConsentPage({
  tokenId,
  isAr = true,
}) {
  const title = isAr
    ? "المتابعة إلى واتساب"
    : "Continue to WhatsApp";

  const consentMessage = isAr
    ? "سيقوم TrustedLinks بتحويلك بأمان إلى النشاط التجاري المختار عبر واتساب."
    : "TrustedLinks will safely redirect you to the selected business on WhatsApp.";

  const buttonText = isAr
    ? "أوافق وأكمل إلى واتساب"
    : "Agree and continue to WhatsApp";

  const loadingText = isAr
    ? "جاري فتح واتساب..."
    : "Opening WhatsApp...";

  const note = isAr
    ? "سيتم فتح واتساب بعد التأكيد."
    : "WhatsApp will open after confirmation.";

  return `
<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
<head>
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #f0fdf4, #ffffff);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 22px;
      color: #102018;
    }

    .card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: 24px;
      padding: 30px 26px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.10);
      border: 1px solid #e7f5ec;
      text-align: center;
    }

    .logo {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      margin: 0 auto 18px;
      background: #0A7C55;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: bold;
    }

    h2 {
      margin: 10px 0 18px;
      font-size: 27px;
      color: #0A7C55;
    }

    p {
      margin: 10px 0;
      line-height: 1.8;
      font-size: 16px;
      color: #475569;
    }

    .button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #0A7C55;
      color: white;
      padding: 16px 18px;
      border-radius: 16px;
      margin-top: 26px;
      text-decoration: none;
      font-weight: bold;
      font-size: 17px;
      transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
    }

    .button:active {
      transform: scale(0.97);
    }

    .button.loading {
      background: #075f42;
      opacity: 0.9;
      pointer-events: none;
      transform: scale(0.98);
    }

    .spinner {
      width: 19px;
      height: 19px;
      border: 2px solid rgba(255,255,255,0.5);
      border-top-color: white;
      border-radius: 50%;
      display: none;
      animation: spin 0.75s linear infinite;
    }

    .button.loading .spinner {
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .note {
      margin-top: 14px;
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>

<body>
  <div class="card">
    <div class="logo">✓</div>

    <h2>${title}</h2>

    <p>${consentMessage}</p>

    <a
      id="continueBtn"
      class="button"
      href="/l/${encodeURIComponent(tokenId)}?acceptConsent=1"
    >
      <span class="spinner"></span>
      <span id="btnText">${buttonText}</span>
    </a>

    <div class="note">${note}</div>
  </div>

  <script>
    const btn = document.getElementById("continueBtn");
    const btnText = document.getElementById("btnText");

    btn.addEventListener("click", function () {
      btn.classList.add("loading");
      btnText.textContent = "${loadingText}";
    });
  </script>
</body>
</html>
`;
}
