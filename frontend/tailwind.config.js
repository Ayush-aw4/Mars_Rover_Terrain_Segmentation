/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mars: {
          bg: '#090B0F',
          secondary: '#10141B',
          card: '#151B24',
          border: '#29313D',
          orange: '#E87542',
          sand: '#E6BD62',
          soil: '#A87952',
          bedrock: '#89939D',
          rock: '#D95A52',
          text: '#F3F4F6',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}

