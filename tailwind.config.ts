import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#131313",
        "surface-low": "#191919",
        "surface-mid": "#1e1e1e",
        "surface-high": "#262626",
        primary: "#C3C0FF",
        "primary-container": "#4F46E5",
      },
    },
  },
  plugins: [],
} satisfies Config;
