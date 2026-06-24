import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#731D36", light: "#8B2A45", dark: "#5C162B" },
        secondary: { DEFAULT: "#C9A96E", light: "#D4B98A", dark: "#B8944A" },
        accent: "#E2A6C0",
        surface: { DEFAULT: "#1A1A2E", light: "#232340", dark: "#12121E" },
      },
    },
  },
  plugins: [],
}
export default config
