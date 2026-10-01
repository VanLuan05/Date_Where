/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', '"Times New Roman"', 'Times', 'serif'],
        sans: ['"Lora"', '"Times New Roman"', 'Times', 'serif'],
        body: ['"Lora"', '"Times New Roman"', 'Times', 'serif'],
        display: ['"Playfair Display"', '"Times New Roman"', 'Times', 'serif'],
      },
      colors: {
        rose: { 50:"#fff1f2",100:"#ffe4e6",200:"#fecdd3",300:"#fda4af",400:"#fb7185",500:"#f43f5e",600:"#e11d48",700:"#be123c",800:"#9f1239",900:"#881337" },
        pink: { 50:"#fdf2f8",100:"#fce7f3",200:"#fbcfe8",300:"#f9a8d4",400:"#f472b6",500:"#ec4899",600:"#db2777",700:"#be185d",800:"#9d174d",900:"#831843" },
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "spin-slow": "spin 8s linear infinite",
        "bounce-soft": "bounceSoft 1.5s ease-in-out infinite",
        "heart-beat": "heartBeat 1.2s ease-in-out infinite",
        "confetti": "confetti 0.6s ease-out",
        "shimmer": "shimmer 1.5s infinite",
      },
      keyframes: {
        float: { "0%,100%": {transform:"translateY(0)"}, "50%": {transform:"translateY(-8px)"} },
        slideUp: { "0%": {transform:"translateY(20px)",opacity:"0"}, "100%": {transform:"translateY(0)",opacity:"1"} },
        fadeIn: { "0%": {opacity:"0"}, "100%": {opacity:"1"} },
        bounceSoft: { "0%,100%": {transform:"translateY(0)"}, "50%": {transform:"translateY(-5px)"} },
        heartBeat: { "0%,100%": {transform:"scale(1)"}, "14%": {transform:"scale(1.1)"}, "28%": {transform:"scale(1)"}, "42%": {transform:"scale(1.1)"}, "70%": {transform:"scale(1)"} },
        confetti: { "0%": {transform:"scale(0) rotate(0deg)",opacity:"1"}, "100%": {transform:"scale(1.5) rotate(180deg)",opacity:"0"} },
        shimmer: { "0%": {backgroundPosition:"-1000px 0"}, "100%": {backgroundPosition:"1000px 0"} },
      },
      boxShadow: {
        "romantic": "0 4px 24px -4px rgba(244,63,94,0.25)",
        "card": "0 8px 32px -8px rgba(0,0,0,0.08)",
        "card-hover": "0 20px 60px -12px rgba(244,63,94,0.3)",
        "glow-rose": "0 0 30px rgba(244,63,94,0.4)",
        "inner-rose": "inset 0 2px 8px rgba(244,63,94,0.1)",
      },
    },
  },
  plugins: [],
}
