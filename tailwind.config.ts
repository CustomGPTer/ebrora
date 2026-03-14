import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ebrora: {
          DEFAULT: "#1B5745",
          light: "#E8F0EC",
          mid: "#C2D9CB",
          dark: "#143F33",
        },
      },
    },
  },
  plugins: [],
};

export default config;
