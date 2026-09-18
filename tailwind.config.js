/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#070609',
          900: '#0c0b10',
          850: '#121118',
          800: '#181722',
          750: '#201e2c',
          700: '#2a2838',
          600: '#3c3a4f',
        },
        emeraldDark: {
          950: '#060f0a',
          900: '#0b1911',
          800: '#11271b',
          700: '#183827',
        },
        gold: {
          300: '#f0d28d',
          400: '#dfb76c',
          500: '#c59a58',
          600: '#a87e3d',
          700: '#876229',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f8f5ee',
          200: '#ede6d8',
          300: '#ded3be',
        },
        luxe: {
          bg: '#0c0b10',
          surface: '#14131b',
          card: '#181722',
          cardHover: '#1f1d2b',
          border: 'rgba(197, 154, 88, 0.2)',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
          gold: '#c59a58',
          goldLight: '#dfb76c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        condensed: ['Oswald', 'Impact', 'sans-serif'],
        display: ['Oswald', 'Playfair Display', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Playfair Display', 'Georgia', 'serif'],
        accent: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        'gold-sm': '0 4px 15px -3px rgba(197, 154, 88, 0.25)',
        'gold': '0 10px 30px -5px rgba(197, 154, 88, 0.35)',
        'gold-lg': '0 20px 45px -10px rgba(197, 154, 88, 0.45)',
        'dark-card': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
        'panel': '0 20px 50px -10px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
}
