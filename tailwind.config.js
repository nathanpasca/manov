/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  daisyui: {
    themes: [
      {
        "manov-light": {
          primary: "#815600",
          "primary-focus": "#291800",
          "primary-content": "#ffddb1",

          secondary: "#805600",
          "secondary-focus": "#281800",
          "secondary-content": "#ffddaf",

          accent: "#7e5700",
          "accent-focus": "#281900",
          "accent-content": "#ffdeab",

          neutral: "#817567",
          "neutral-focus": "#251a00",
          "neutral-content": "#efe0cf",

          "base-100": "#fffbff",
          "base-200": "#efe0cf",
          "base-300": "#ced3d9",
          "base-content": "#4f4539",

          info: "#1c92f2",
          success: "#009485",
          warning: "#ff9900",
          error: "#ba1a1a",

          "--rounded-box": "1rem",
          "--rounded-btn": ".5rem",
          "--rounded-badge": "1.9rem",

          "--animation-btn": ".25s",
          "--animation-input": ".2s",

          "--btn-text-case": "uppercase",
          "--navbar-padding": ".5rem",
          "--border-btn": "1px",
        },
      },
      {
        "manov-dark": {
          primary: "#624000",
          "primary-focus": "#442b00",
          "primary-content": "#ffba4b",

          secondary: "#614000",
          "secondary-focus": "#432c00",
          "secondary-content": "#fdba4a",

          accent: "#5f4100",
          "accent-focus": "#422c00",
          "accent-content": "#fabc49",

          neutral: "#251a00",
          "neutral-focus": "#422c00",
          "neutral-content": "#ffdf9c",

          "base-100": "#251a00",
          "base-200": "#422c00",
          "base-300": "#4f4539",
          "base-content": "#ffdf9c",

          info: "#66c7ff",
          success: "#87cf3a",
          warning: "#e1d460",
          error: "#ff6b6b",

          "--rounded-box": "1rem",
          "--rounded-btn": ".5rem",
          "--rounded-badge": "1.9rem",

          "--animation-btn": ".25s",
          "--animation-input": ".2s",

          "--btn-text-case": "uppercase",
          "--navbar-padding": ".5rem",
          "--border-btn": "1px",
        },
      },
    ],
  },
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}
