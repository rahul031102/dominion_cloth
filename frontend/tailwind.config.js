/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#F4F2EC",
        navy: "#1B2A4A",
        crimson: "#B3261E",
        line: "#E5E1D8",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
