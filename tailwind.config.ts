import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/data/**/*.{ts,tsx}",
    // Batch 10 Phase 3: categoryColors.ts exports Tailwind class strings
    // used by VariantPicker and TemplateGalleryModal. Without this glob the
    // JIT compiler wouldn't scan them and the category tints would render
    // as no-ops in production.
    "./src/lib/visualise/**/*.{ts,tsx}",
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
