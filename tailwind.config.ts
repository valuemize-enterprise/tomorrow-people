import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        sans:    ["DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        ink: {
          primary:   "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          tertiary:  "var(--ink-tertiary)",
          inverse:   "var(--ink-inverse)",
        },
        accent:  {
          DEFAULT: "var(--accent)",
          light:   "var(--accent-light)",
          border:  "var(--accent-border)",
        },
        success: {
          DEFAULT: "var(--success)",
          light:   "var(--success-light)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        ease:   "cubic-bezier(0.25,0.46,0.45,0.94)",
        spring: "cubic-bezier(0.34,1.56,0.64,1)",
      },
      animation: {
        "fade-up":    "fade-up 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "fade-in":    "fade-in 0.25s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "scale-in":   "scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        "pulse-once": "pulse-once 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        shimmer:      "shimmer 1.4s ease infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)"   },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to:   { opacity: "1", transform: "scale(1)"    },
        },
        "pulse-once": {
          "0%, 100%": { transform: "scale(1)"    },
          "50%":       { transform: "scale(1.18)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition:  "200% 0" },
        },
      },
    },
  },
  plugins: [],
}

export default config
