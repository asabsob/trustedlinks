export function renderWhatsAppRedirectPage({
  waUrl,
  fallbackUrl,
}) {
  return `
<html>
  <head>
    <meta http-equiv="refresh" content="0; url=${waUrl}" />
    <script>
      setTimeout(function() {
        window.location.href = "${fallbackUrl}";
      }, 500);
    </script>
  </head>
  <body>
    Redirecting to WhatsApp...
  </body>
</html>
`;
}
