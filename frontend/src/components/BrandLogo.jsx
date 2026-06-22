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
      alt="Trusted Links"
      className={className}
    />
  );
}
