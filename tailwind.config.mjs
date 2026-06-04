/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-tajawal)",
          "var(--font-inter)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "var(--font-tajawal)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // Primary: deep navy blue (trust, authority)
        brand: {
          50: "#eaf2fa",
          100: "#cfe0f2",
          200: "#a5c2e3",
          300: "#719ecf",
          400: "#477bb6",
          500: "#1f5d99",
          600: "#154b80",
          700: "#0f3b66",
          800: "#0a2a4a",
          900: "#061a2e",
          950: "#030d18",
        },
        // Accent: teal (modern, fresh, distinctive)
        accent: {
          50: "#e6f8f4",
          100: "#c2ede1",
          200: "#86dac4",
          300: "#4ec3a7",
          400: "#27a98c",
          500: "#1a8c73",
          600: "#13705c",
          700: "#10594a",
          800: "#0d463b",
          900: "#0a3830",
          950: "#051e1a",
        },
        ink: {
          50: "#f7f9fc",
          100: "#eef2f7",
          200: "#dbe3ed",
          300: "#b8c5d4",
          400: "#889aae",
          500: "#5e7388",
          600: "#475868",
          700: "#374553",
          800: "#1f2a36",
          900: "#0f1620",
          950: "#070b11",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "navy-gradient":
          "linear-gradient(135deg, #0a1d33 0%, #173e6b 50%, #2a9d8b 100%)",
        "navy-radial":
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(42,157,139,0.18), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 10%, rgba(31,79,134,0.18), transparent 60%), linear-gradient(to bottom, #f7f9fc, #ffffff)",
      },
    },
  },
  plugins: [],
};
