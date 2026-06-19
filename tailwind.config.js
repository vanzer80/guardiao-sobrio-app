/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: '#0e0d0c',
        surface: '#141312',
        'surface-raised': '#1a1917',

        // Text
        text: '#e8e6e2',
        muted: '#8a8782',

        // Accents
        gold: '#c8a84b',
        'gold-dim': '#a68a3a',
        emergency: '#e07b2a',
        'emergency-dim': '#b85f1f',

        // Feedback
        success: '#4a7c59',
        danger: '#8b2e2e',
      },
      fontFamily: {
        display: ['CormorantGaramond'],
        body: ['GeneralSans'],
        mono: ['JetBrainsMono'],
      },
    },
  },
  plugins: [],
};
