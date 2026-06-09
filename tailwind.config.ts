import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981',
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        accent: {
          DEFAULT: '#06b6d4',
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Cores do Daimach.Movement
        'daimach-primary': '#06b6d4',    // Turquesa/Aqua
        'daimach-secondary': '#ec4899',  // Rosa/Magenta
        'daimach-dark': '#1a1a2e',       // Cinza escuro
        'daimach-accent': '#fbbf24',     // Ouro/Amarelo
        'daimach-light': '#f8fafc',      // Cinza claro
      },
      backgroundImage: {
        'daimach-gradient': 'linear-gradient(135deg, #06b6d4 0%, #ec4899 100%)',
        'daimach-dark-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
