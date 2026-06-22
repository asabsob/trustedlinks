export default function BrandLogo({
  lang = "en",
  className = "h-12 w-auto",
}) {
  return (
    <img
      src="/trustedlinks-logo.svg"
      alt={lang === "ar" ? "ترستيد لينكس" : "Trusted Links"}
      className={className}
      loading="eager"
    />
  );
}
