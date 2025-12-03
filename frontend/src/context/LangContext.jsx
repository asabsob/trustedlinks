import { createContext, useContext, useState, useEffect } from "react";

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

  // Save language preference
  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.dir = lang === "ar" ? "rtl" : "ltr"; // Set direction dynamically
    document.documentElement.lang = lang;
  }, [lang]);

  // Toggle language function
  const toggleLang = () => setLang((prev) => (prev === "en" ? "ar" : "en"));

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
