/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        tajawal: ["Tajawal", "sans-serif"],
      },
      colors: {
        primary: "#22c55e",
        secondary: "#34d399",
      },
    },
  },
  plugins: [],
};
