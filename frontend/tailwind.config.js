/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Onest", "system-ui", "sans-serif"],
        display: ["Onest", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        /* Dribbble palette */
        aegis: {
          sidebar:   "#232E32",
          sidebarHover: "rgba(255,255,255,0.06)",
          bg:        "#F2F4F8",
          white:     "#FFFFFF",
          blue:      "#1B47DB",
          blueSoft:  "#94B5E3",
          blueLight: "#EEF3FF",
          blueMid:   "#6997E4",
          purple:    "#C6C3D7",
          terracotta:"#B26552",
          gray:      "#9B9B9B",
          grayLight: "#EBEBEC",
          dark:      "#232E32",
          approve:   "#22C55E",
          reject:    "#B26552",
          escalate:  "#D97706",
          border:    "#E8EDF5",
          text:      "#1C2B34",
          muted:     "#7B8FA6",
        },
      },
      boxShadow: {
        "card":      "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(27,71,219,0.06)",
        "card-hover":"0 4px 24px rgba(27,71,219,0.12)",
        "sidebar":   "4px 0 24px rgba(0,0,0,0.08)",
        "blue":      "0 4px 14px rgba(27,71,219,0.30)",
        "top":       "0 -2px 10px rgba(0,0,0,0.05)",
      },
      animation: {
        "fade-up":    "fadeUp 0.45s ease-out forwards",
        "fade-in":    "fadeIn 0.35s ease-out forwards",
        "slide-in":   "slideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "count-up":   "fadeIn 0.8s ease-out forwards",
        "ping-slow":  "ping 2s cubic-bezier(0,0,0.2,1) infinite",
      },
      keyframes: {
        fadeUp:  { "0%": { opacity:"0", transform:"translateY(14px)" }, "100%": { opacity:"1", transform:"translateY(0)" } },
        fadeIn:  { "0%": { opacity:"0" }, "100%": { opacity:"1" } },
        slideIn: { "0%": { opacity:"0", transform:"translateX(-12px)" }, "100%": { opacity:"1", transform:"translateX(0)" } },
      },
    },
  },
  plugins: [],
  safelist: [
    "text-aegis-approve","text-aegis-reject","text-aegis-escalate",
    "bg-green-50","bg-red-50","bg-amber-50",
    "border-green-200","border-red-200","border-amber-200",
  ],
};
