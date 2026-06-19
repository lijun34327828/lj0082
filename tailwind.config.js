/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          dark: '#0a0e27',
          card: '#1a1f3a',
          green: '#00e68a',
          orange: '#ff6b35',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
