/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4f9',
          100: '#dae3f0',
          600: '#2d5a8e',
          700: '#1e3a5f',
          800: '#162d4a',
          900: '#0f1f35',
        },
        teal: {
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
        },
        danger:  '#dc2626',
        warning: '#d97706',
        safe:    '#16a34a',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
