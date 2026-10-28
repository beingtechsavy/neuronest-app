import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        haven: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        discord: {
          darkest: '#1E1F22',
          dark: '#2B2D31',
          base: '#313338',
          card: '#2B2D31',
          elevated: '#383A40',
          border: '#3F4147',
          input: '#1E1F22',
          text: {
            primary: '#F2F3F5',
            secondary: '#DBDEE1',
            muted: '#949BA4',
          },
          green: '#23A55A',
          gold: '#FEE75C',
          blurple: '#5865F2',
        },
      },
    },
  },
  plugins: [],
};
export default config;