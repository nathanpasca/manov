/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  daisyui: {
    themes: ["light", "luxury"],
  },
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}

