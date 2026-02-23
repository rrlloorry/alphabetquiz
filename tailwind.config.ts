import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        baloo: ['"Baloo 2"', '"Noto Sans KR"', 'sans-serif'],
        nunito: ['Nunito', '"Noto Sans KR"', 'sans-serif'],
      },
      colors: {
        cream: '#FFFEF0',
        'brand-yellow': '#FBBF24',
        'brand-blue': '#38BDF8',
        'brand-pink': '#F472B6',
        'brand-green': '#34D399',
        'brand-navy': '#1E1B4B',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        'star-burst': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1.5) rotate(720deg)', opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        float: 'float 3s ease-in-out infinite',
        wiggle: 'wiggle 0.6s ease-in-out',
        'star-burst': 'star-burst 0.8s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out',
        'confetti-fall': 'confetti-fall linear forwards',
      },
    },
  },
  plugins: [],
};

export default config;
