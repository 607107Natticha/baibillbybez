/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F472B6',
          secondary: '#FB7185',
          light: '#FCE7F3',
        },
        pastel: {
          pink: '#F472B6',
          orange: '#FDBA74',
          blue: '#7DD3FC',
          green: '#6EE7B7',
        },
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
}