/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aegis: {
          navy: "#0F2A47",
          blue: "#2E5C8A",
          slate: "#475569",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          approve: "#16A34A",
          reject: "#DC2626",
          escalate: "#D97706",
          border: "#E2E8F0",
          navyLight: "#1a3a5c",
          navyDark: "#0a1e33",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "aegis-mesh":
          "radial-gradient(at 40% 20%, hsla(210,100%,16%,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(210,80%,30%,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(210,60%,60%,0.04) 0px, transparent 50%)",
        "aegis-hero":
          "linear-gradient(135deg, #0F2A47 0%, #1a3a5c 40%, #2E5C8A 100%)",
      },
      boxShadow: {
        "glass-sm": "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
        "glass-md": "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        "glass-lg": "0 8px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.95)",
        "card-hover": "0 12px 40px rgba(15,42,71,0.15)",
        "verdict-approve": "0 4px 20px rgba(22,163,74,0.2)",
        "verdict-reject": "0 4px 20px rgba(220,38,38,0.2)",
        "verdict-escalate": "0 4px 20px rgba(217,119,6,0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "pulse-blue": "pulseBlue 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spin 3s linear infinite",
        "scan-line": "scanLine 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseBlue: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(46,92,138,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(46,92,138,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scanLine: {
          "0%, 100%": { top: "0%" },
          "50%": { top: "100%" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
  safelist: [
    "bg-green-50", "border-green-300", "text-green-700",
    "bg-red-50", "border-red-300", "text-red-700",
    "bg-amber-50", "border-amber-300", "text-amber-700",
    "bg-blue-50", "border-blue-300", "text-blue-700",
    "bg-slate-50", "border-slate-200", "text-slate-500",
    "shadow-verdict-approve", "shadow-verdict-reject", "shadow-verdict-escalate",
  ],
};
