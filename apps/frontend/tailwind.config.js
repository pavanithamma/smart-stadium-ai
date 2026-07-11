/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fifaGreen: '#00B050',
        fifaBlue: '#0A192F',
      }
    },
  },
  plugins: [],
}