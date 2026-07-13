/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--dark-bg)",
        foreground: "var(--text-dark)",
        card: "var(--dark-panel)",
        border: "var(--dark-border)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#fff",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "#fff",
        },
        muted: {
          DEFAULT: "var(--dark-panel)",
          foreground: "var(--text-dark-muted)",
        },
      },
    },
  },
  plugins: [],
}
