/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFF4EE',
          100: '#FFE4D4',
          200: '#FFC9A8',
          300: '#FFAE7D',
          400: '#FF8C56',
          500: '#FF6B35',
          600: '#E5551F',
          700: '#BF4419',
          800: '#993613',
          900: '#73280E',
        },
        secondary: {
          DEFAULT: '#FFD166',
          50: '#FFFBF0',
          100: '#FFF3D4',
          200: '#FFE7A8',
          300: '#FFDB7D',
          400: '#FFD166',
          500: '#FFC233',
          600: '#FFB300',
          700: '#CC8F00',
          800: '#996B00',
          900: '#664800',
        },
        accent: {
          DEFAULT: '#06D6A0',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#06D6A0',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        dark: '#1A1A2E',
        surface: '#FFFFFF',
        muted: '#F7F3EE',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.08)',
        hover: '0 8px 40px rgba(255,107,53,0.2)',
        glow: '0 0 40px rgba(255,107,53,0.3)',
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'confetti-fall': 'confettiFall 3s ease-out forwards',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(-90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,107,53,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(255,107,53,0.5)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
