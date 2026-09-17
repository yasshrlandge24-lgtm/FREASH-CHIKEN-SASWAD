import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#22201D',
        inkSoft: '#4A463F',
        bg: '#FAF7F0',
        paper: '#EFE6D3',
        paperDeep: '#E4D8BE',
        gold: '#D9A441',
        goldDark: '#B9832B',
        sage: '#5C7A5C',
        sageDark: '#48603F',
        barn: '#8C3A2B',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
      },
    },
  },
  plugins: [],
};

export default config;
