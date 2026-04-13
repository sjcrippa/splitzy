/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "primary-dark": "#4f46e5",
        secondary: "#f59e0b",
        surface: "#1e1e2e",
        "surface-light": "#2a2a3e",
        background: "#121220",
        danger: "#ef4444",
        success: "#22c55e",
      },
    },
  },
  plugins: [],
};
