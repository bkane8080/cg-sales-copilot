/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        velvet: { gold: '#e6c87a', dark: '#1a1a2e', navy: '#16213e', accent: '#0f3460', rose: '#c4a07a' }
      },
      fontFamily: { display: ['Georgia', 'serif'], body: ['Inter', 'sans-serif'] }
    },
  },
  plugins: [],
}
