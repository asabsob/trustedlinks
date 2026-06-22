export default function BrandLogo({
  lang = "en",
  className = "h-12 w-auto",
}) {
  const logo =
    lang === "ar"
      ? "/trustedlinks-logo-ar.svg"
      : "/trustedlinks-logo-en.svg";

  return (
    <img
      src={logo}
      alt={lang === "ar" ? "ترستيد لينكس" : "Trusted Links"}
      className={className}
      loading="eager"
    />
  );
}
