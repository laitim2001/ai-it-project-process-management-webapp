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
          DEFAULT: '#0052CC',
          hover: '#4C9AFF',
        },
        secondary: {
          DEFAULT: '#42526E',
        },
        success: '#00875A',
        warning: '#FFAB00',
        danger: '#DE350B',
      },
    },
  },
  plugins: [],
};
export default config;
