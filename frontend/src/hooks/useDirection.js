import { useEffect } from "react"

export function useDirection(lang) {
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"

    const style = document.getElementById("rtl-style") || document.createElement("style")
    style.id = "rtl-style"
    style.innerHTML =
      lang === "ar"
        ? `
        body {
          direction: rtl;
          text-align: right;
          font-family: 'Tajawal', sans-serif;
        }
        input, textarea, select {
          text-align: right;
          direction: rtl;
        }
        nav, .container {
          flex-direction: row-reverse;
        }
        label { text-align: right; }
      `
        : `
        body {
          direction: ltr;
          text-align: left;
          font-family: 'Inter', sans-serif;
        }
        input, textarea, select {
          text-align: left;
          direction: ltr;
        }
        nav, .container {
          flex-direction: row;
        }
        label { text-align: left; }
      `
    document.head.appendChild(style)
  }, [lang])
}