import type { Config } from 'tailwindcss';

// TEMA CLARO DA MARCA (igual ao site daimach.com.br)
// Redefinimos as escalas slate/gray/green que o app usa em todo lugar para
// tons claros: slate-900 (fundo) -> creme, slate-800 (cards) -> branco,
// slate-300/400 (textos) -> escuros, green (destaque) -> dourado.
const lightSlate = {
  50:  '#2c3327', // textos mais escuros
  100: '#2c3327',
  200: '#38402a',
  300: '#46503a', // texto secundário
  400: '#69715a', // texto muted
  500: '#8a907b', // placeholder
  600: '#cdc6b6', // bordas mais fortes
  700: '#dcd5c7', // bordas / divisórias
  800: '#ffffff', // cards / superfícies
  900: '#f6f1e8', // fundo creme (página)
  950: '#efe9dc',
};

const gold = {
  50:  '#f7f1e4',
  100: '#eee1c7',
  200: '#e0cda0',
  300: '#d0b478',
  400: '#c2a05c',
  500: '#b49352', // dourado da marca
  600: '#b49352', // botões/destaques
  700: '#9a7c40', // hover
  800: '#7c6433',
  900: '#5d4b27',
};

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: lightSlate,
        gray: lightSlate,
        green: gold,
        emerald: gold,
        primary: gold,
        accent: { ...gold, DEFAULT: '#b49352' },
        // Tokens de marca
        cream: '#f6f1e8',
        sand: '#d8d1c4',
        sage: '#c4ccac',
        forest: '#38402a',
        gold: '#b49352',
        ink: '#2c3327',
        // Daimach
        'daimach-primary': '#b49352', // dourado
        'daimach-secondary': '#497c40',
        'daimach-dark': '#38402a',    // verde-oliva profundo (texto/acentos)
        'daimach-accent': '#b49352',  // dourado
        'daimach-light': '#f6f1e8',   // creme
      },
      backgroundImage: {
        'daimach-gradient': 'linear-gradient(135deg, #c4ccac 0%, #b49352 100%)',
        'daimach-dark-gradient': 'linear-gradient(135deg, #f6f1e8 0%, #ece6d8 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
