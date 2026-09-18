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
        // Mother — Fuchsia / Violet spectrum
        mother: {
          50:      '#fdf4ff',
          100:     '#fae8ff',
          200:     '#f5d0fe',
          300:     '#f0abfc',
          400:     '#e879f9',
          DEFAULT: '#d946ef',
          500:     '#d946ef',
          600:     '#c026d3',
          700:     '#a21caf',
          800:     '#86198f',
          light:   '#e879f9',
          mid:     '#d946ef',
          dark:    '#c026d3',
          glow:    'rgba(192,38,211,0.25)',
        },
        // Father — Cyan / Sky spectrum
        father: {
          50:      '#ecfeff',
          100:     '#cffafe',
          200:     '#a5f3fc',
          300:     '#67e8f9',
          400:     '#38bdf8',
          DEFAULT: '#06b6d4',
          500:     '#06b6d4',
          600:     '#0891b2',
          700:     '#0e7490',
          800:     '#155e75',
          light:   '#38bdf8',
          mid:     '#06b6d4',
          dark:    '#0891b2',
          glow:    'rgba(8,145,178,0.25)',
        },
        // Shared accent tokens
        legacy: {
          amber:   '#fbbf24',
          gold:    '#d97706',
          success: '#059669',
          teal:    '#0d9488',
          purple:  '#7c3aed',
        },
        // App surface tokens
        navy: {
          950: '#060b18',
          900: '#0c1425',
          800: '#101c30',
          700: '#1a2d45',
          600: '#234260',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'mother-glow': '0 0 30px rgba(192, 38, 211, 0.2)',
        'father-glow': '0 0 30px rgba(8, 145, 178, 0.2)',
        'card':        '0 4px 24px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
