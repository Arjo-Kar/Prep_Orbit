/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Fira Code', 'Monaco', 'Consolas', 'Ubuntu Mono', 'monospace'],
      },
      colors: {
        code: {
          background: '#1e1e1e',
          text: '#d4d4d4',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}